from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
from PIL import Image
import torch
import torchvision.transforms as T
import io
import traceback
import base64
import numpy as np
from quantification import quantify_crack
from crack_model import create_model  # UNet++ factory

# --------- FASTAPI APP ---------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # can be restricted later to the React origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- MODEL CONFIG ---------

device = torch.device("cpu")  # CPU inference
NUM_CLASSES = 2               # Background + Crack

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "model.pth"  # backend/model/model.pth


def load_model():
    """
    Recreate the UNet++ MobileNetV2 model and load model_state_dict
    from the training checkpoint at MODEL_PATH.
    """
    try:
        print(f"Loading model from: {MODEL_PATH}")

        checkpoint = torch.load(
            MODEL_PATH,
            map_location=device,
            weights_only=False,  # trusted checkpoint
        )

        print("Checkpoint type:", type(checkpoint))
        if isinstance(checkpoint, dict):
            print("Checkpoint keys:", list(checkpoint.keys()))

        # Build architecture
        model = create_model(num_classes=NUM_CLASSES)

        # Load weights from model_state_dict
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
        else:
            state_dict = checkpoint

        model.load_state_dict(state_dict)

        # Move to device + eval
        model.to(device)
        model.eval()

        print("Model loaded successfully")
        return model

    except Exception as e:
        print("Error loading model:", repr(e))
        raise e


model = load_model()

# Preprocessing: match training/eval (512x512 + ImageNet normalization)
transform = T.Compose([
    T.Resize((512, 512)),
    T.ToTensor(),
    T.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# --------- ROUTES ---------


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Run UNet++ crack segmentation on the uploaded image.

    Returns:
        - success: bool
        - file_name: str
        - output_info: list (shape of the logits tensor)
    """
    try:
        # 1) Read uploaded file and open as RGB image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # 2) Preprocess to tensor [1, 3, 512, 512]
        tensor = transform(image).unsqueeze(0).to(device)

        # 3) Inference
        with torch.no_grad():
            logits = model(tensor)  # [1, NUM_CLASSES, H, W]
            probs = torch.softmax(logits, dim=1)

        crack_probs = probs[:, 1, :, :]  # [1, H, W]
        crack_mask = (crack_probs >= 0.5).float()

        height = int(crack_mask.shape[-2])
        width = int(crack_mask.shape[-1])
        crack_pixels = float(crack_mask.sum().item())
        total_pixels = float(height * width)
        crack_coverage_pct = (crack_pixels / total_pixels) * 100.0 if total_pixels else 0.0

        crack_pixels_probs = crack_probs[crack_mask == 1]
        if crack_pixels_probs.numel() > 0:
            avg_confidence = float(crack_pixels_probs.mean().item())
        else:
            avg_confidence = 0.0
        max_confidence = float(crack_probs.max().item())

        if crack_coverage_pct < 0.5:
            severity = "None / Very Low"
        elif crack_coverage_pct < 2.0:
            severity = "Low"
        elif crack_coverage_pct < 5.0:
            severity = "Medium"
        else:
            severity = "High"

        # Prepare overlay image
        image_resized = image.resize((512, 512))
        img_np = np.array(image_resized.convert("RGB"), dtype=np.uint8)
        crack_mask_np = crack_mask.squeeze(0).cpu().numpy().astype("uint8")

        quant_metrics = quantify_crack(
            crack_mask_np,
            px_to_mm=0.077,
            visualize=False,
        ) or {}

        overlay = img_np.copy()
        red = np.array([255, 0, 0], dtype=np.uint8)
        alpha = 0.5
        mask_indices = crack_mask_np == 1
        overlay[mask_indices] = (
            alpha * red + (1 - alpha) * overlay[mask_indices]
        ).astype(np.uint8)

        pil_overlay = Image.fromarray(overlay)
        buf = io.BytesIO()
        pil_overlay.save(buf, format="PNG")
        overlay_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "file_name": file.filename,
            "height": height,
            "width": width,
            "crack_coverage_pct": crack_coverage_pct,
            "avg_confidence": avg_confidence,
            "max_confidence": max_confidence,
            "severity": severity,
            "quantification": {
                "length_mm": float(quant_metrics.get("length_mm", 0.0)),
                "max_width_mm": float(quant_metrics.get("max_width_mm", 0.0)),
                "mean_width_mm": float(quant_metrics.get("mean_width_mm", 0.0)),
            },
            "overlay_image_b64": overlay_b64,
        }

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Model inference failed: {repr(e)}",
            },
        )
