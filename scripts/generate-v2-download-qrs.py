#!/usr/bin/env uv run
# /// script
# dependencies = ["pillow", "qrcode[pil]"]
# ///
"""Generate v2 install-landing QR codes under v2/public/v2/download/.

The QR images reuse the v1 visual treatment (rounded module dots and finder
eyes) but encode the v2-specific redirect routes served beneath /install/.
"""
from pathlib import Path

import qrcode
from PIL import Image
from qrcode.constants import ERROR_CORRECT_H
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import CircleModuleDrawer, RoundedModuleDrawer

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "v2" / "public" / "v2" / "download"
SIZE = (160, 160)

DESTINATIONS = {
    "ios-qr.png": "https://predix-health.ru/install/go/ios/",
    "android-qr.png": "https://predix-health.ru/install/go/android/",
}


def generate_qr(destination: str, output_path: Path) -> None:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=16,
        border=4,
    )
    qr.add_data(destination)
    qr.make(fit=True)

    image = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=CircleModuleDrawer(),
        eye_drawer=RoundedModuleDrawer(radius_ratio=1),
    ).convert("RGB")
    image = image.resize(SIZE, Image.Resampling.LANCZOS)
    image = image.convert("L").point(lambda value: 255 if value > 128 else 0, mode="1")
    image.save(output_path, optimize=True)


OUTPUT.mkdir(parents=True, exist_ok=True)
for filename, destination in DESTINATIONS.items():
    path = OUTPUT / filename
    generate_qr(destination, path)
    print(f"{path}: {destination}")
