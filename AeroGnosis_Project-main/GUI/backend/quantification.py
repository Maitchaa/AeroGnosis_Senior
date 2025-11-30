# TODO (for Copilot):
# This file currently mixes library code and notebook-style usage.
# 1. Keep ONLY the reusable functions:
#    - medial_axis_skeletonize(binary_mask)
#    - calculate_crack_length(skeleton, px_to_mm=0.077)
#    - calculate_crack_width(binary_mask, skeleton, distance_map, px_to_mm=0.077)
#    - quantify_crack(binary_mask, px_to_mm=0.077, visualize=False)
# 2. Remove/convert all top-level "Usage" code, prints, and hard-coded paths.
# 3. Default visualize=False so the FastAPI backend can call quantify_crack
#    without trying to open matplotlib windows.
# 4. Ensure quantify_crack returns a pure Python dict with ONLY:
#      {
#        "length_mm": float,
#        "max_width_mm": float,
#        "mean_width_mm": float
#      }
#    (Do NOT return skeleton or width_array in the API-facing version.)
# 5. Make sure imports are exactly: numpy as np, cv2,
#    distance_transform_edt, ski_skeletonize, and any needed skimage functions.
# backend/quantification.py
import numpy as np
import cv2
from scipy.ndimage import distance_transform_edt
from skimage.morphology import skeletonize as ski_skeletonize

def medial_axis_skeletonize(binary_mask: np.ndarray):
    mask = (binary_mask > 0).astype(np.uint8)
    distance_map = distance_transform_edt(mask)
    skeleton = ski_skeletonize(mask.astype(bool))
    return skeleton, distance_map

def calculate_crack_length(skeleton: np.ndarray, px_to_mm: float = 0.077) -> float:
    if skeleton.sum() == 0:
        return 0.0

    coords = np.column_stack(np.where(skeleton))
    if len(coords) < 2:
        return 0.0

    LC = 0.0
    previous_point = coords[0]
    for y, x in coords[1:]:
        y_prev, x_prev = previous_point
        displacement = np.sqrt((x - x_prev) ** 2 + (y - y_prev) ** 2)
        LC += displacement
        previous_point = (y, x)

    return float(LC * px_to_mm)

def calculate_crack_width(
    binary_mask: np.ndarray,
    skeleton: np.ndarray,
    distance_map: np.ndarray,
    px_to_mm: float = 0.077,
):
    mask_uint8 = (binary_mask * 255).astype(np.uint8)
    edges = cv2.Canny(mask_uint8, 100, 200)

    edge_coords = np.column_stack(np.where(edges > 0))
    if len(edge_coords) == 0:
        return 0.0, 0.0

    skel_coords = np.column_stack(np.where(skeleton))
    if len(skel_coords) == 0:
        return 0.0, 0.0

    crack_widths = []
    for y, x in skel_coords:
        distances = np.sqrt((edge_coords[:, 0] - y) ** 2 + (edge_coords[:, 1] - x) ** 2)
        if len(distances) < 2:
            continue
        idx = np.argsort(distances)[:2]
        nearest_edges = edge_coords[idx]
        dleft = np.linalg.norm(nearest_edges[0] - np.array([y, x]))
        dright = np.linalg.norm(nearest_edges[1] - np.array([y, x]))
        crack_widths.append(dleft + dright)

    if not crack_widths:
        return 0.0, 0.0

    width_array = np.array(crack_widths)
    max_width_mm = float(width_array.max() * px_to_mm)
    mean_width_mm = float(width_array.mean() * px_to_mm)
    return max_width_mm, mean_width_mm

def quantify_crack(
    binary_mask: np.ndarray,
    px_to_mm: float = 0.077,
    visualize: bool = False,  # kept for compatibility, not used in API
) -> dict:
    mask = (binary_mask > 0).astype(np.uint8)
    skeleton, distance_map = medial_axis_skeletonize(mask)
    length_mm = calculate_crack_length(skeleton, px_to_mm=px_to_mm)
    max_width_mm, mean_width_mm = calculate_crack_width(
        mask, skeleton, distance_map, px_to_mm=px_to_mm
    )
    return {
        "length_mm": length_mm,
        "max_width_mm": max_width_mm,
        "mean_width_mm": mean_width_mm,
    }
