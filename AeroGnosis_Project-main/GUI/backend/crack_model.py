import torch.nn as nn
import segmentation_models_pytorch as smp


class UNetPlusPlus(nn.Module):
    """
    UNet++ model with MobileNetV2 encoder for semantic segmentation.
    Matches the training-time architecture:
      smp.UnetPlusPlus(
          encoder_name='mobilenet_v2',
          in_channels=3,
          classes=num_classes,
          activation=None,
      )
    """

    def __init__(self, num_classes: int, encoder_name: str = "mobilenet_v2", pretrained: bool = False):
        super().__init__()
        self.num_classes = num_classes
        self.encoder_name = encoder_name

        self.backbone = smp.UnetPlusPlus(
            encoder_name=encoder_name,
            encoder_weights="imagenet" if pretrained else None,
            in_channels=3,
            classes=num_classes,
            activation=None,  # logits
        )

    def forward(self, x):
        return self.backbone(x)


def create_model(num_classes: int) -> nn.Module:
    """
    Factory for the UNet++ MobileNetV2 model.
    Use pretrained=False for inference; weights will be loaded from model_state_dict.
    """
    return UNetPlusPlus(num_classes=num_classes, encoder_name="mobilenet_v2", pretrained=False)
