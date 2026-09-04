#!/usr/bin/env uv run
# /// script
# dependencies = ["pillow"]
# ///
"""Generate v2 install-landing illustration assets under v2/public/v2/.

Produces:
- v2/public/v2/character/robot.webp (transparent, ordinary build)
- v2/public/v2/character/robot-portal.jpg (opaque, size-tuned for the portal budget)
- v2/public/v2/icons/*.png (branded line icons, transparent PNG, no SVG)

The character is extracted from the supplied robot PNG (not the SVG wrapper).
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
CHARACTER_DIR = ROOT / "v2" / "public" / "v2" / "character"
ICONS_DIR = ROOT / "v2" / "public" / "v2" / "icons"

STROKE_COLOR = (18, 104, 107, 255)  # --tiffany-deep
STROKE_WIDTH = 7
CANVAS = 96


def build_character() -> None:
    if SOURCE is None or not SOURCE.is_file():
        raise SystemExit("Usage: uv run scripts/generate-v2-assets.py /path/to/robot.png")

    CHARACTER_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        robot = source.convert("RGBA")

    robot.save(CHARACTER_DIR / "robot.webp", format="WEBP", quality=82, method=6)

    white = Image.new("RGBA", robot.size, (255, 255, 255, 255))
    flattened = Image.alpha_composite(white, robot).convert("RGB")
    flattened = flattened.resize((600, 900), Image.Resampling.LANCZOS)
    flattened.save(
        CHARACTER_DIR / "robot-portal.jpg",
        format="JPEG",
        quality=74,
        optimize=True,
    )


class LineIcon:
    def __init__(self) -> None:
        self.image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.image)

    def stroke(self, points: list[tuple[int, int]], width: int = STROKE_WIDTH) -> None:
        self.draw.line(points, fill=STROKE_COLOR, width=width, joint="curve")
        radius = width / 2
        for x, y in (points[0], points[-1]):
            self.draw.ellipse(
                (x - radius, y - radius, x + radius, y + radius),
                fill=STROKE_COLOR,
            )

    def circle(self, bbox: tuple[int, int, int, int], width: int = STROKE_WIDTH) -> None:
        self.draw.arc(bbox, 0, 360, fill=STROKE_COLOR, width=width)

    def arc(
        self,
        bbox: tuple[int, int, int, int],
        start: int,
        end: int,
        width: int = STROKE_WIDTH,
    ) -> None:
        self.draw.arc(bbox, start, end, fill=STROKE_COLOR, width=width)

    def save(self, name: str) -> Path:
        ICONS_DIR.mkdir(parents=True, exist_ok=True)
        path = ICONS_DIR / name
        self.image.save(path)
        return path


def advantage_anonymous() -> Path:
    icon = LineIcon()
    icon.circle((33, 23, 63, 53))
    icon.arc((28, 44, 68, 84), 180, 360)
    for index in range(12):
        if index % 2 == 0:
            icon.arc((5, 5, 91, 91), index * 30 + 4, (index + 1) * 30 - 4)
    return icon.save("advantage-anonymous.png")


def advantage_control() -> Path:
    icon = LineIcon()
    icon.stroke([(48, 12), (79, 23), (76, 47), (48, 84), (20, 47), (17, 23), (48, 12)])
    icon.stroke([(36, 46), (45, 57), (63, 35)])
    return icon.save("advantage-control.png")


def advantage_minimum() -> Path:
    icon = LineIcon()
    icon.draw.rounded_rectangle(
        (20, 14, 76, 82), radius=12, outline=STROKE_COLOR, width=STROKE_WIDTH
    )
    icon.stroke([(34, 34), (62, 34)])
    icon.stroke([(34, 58), (41, 65), (56, 50)])
    return icon.save("advantage-minimum.png")


def privacy_data() -> Path:
    icon = LineIcon()
    icon.stroke([(16, 24), (40, 24)])
    icon.stroke([(56, 24), (80, 24)])
    icon.stroke([(40, 15), (40, 33)])
    icon.stroke([(16, 48), (56, 48)])
    icon.stroke([(72, 48), (80, 48)])
    icon.stroke([(64, 39), (64, 57)])
    icon.stroke([(16, 72), (28, 72)])
    icon.stroke([(44, 72), (80, 72)])
    icon.stroke([(36, 63), (36, 81)])
    return icon.save("privacy-data.png")


def privacy_user() -> Path:
    icon = LineIcon()
    icon.circle((12, 12, 84, 84))
    icon.circle((36, 24, 60, 48), width=6)
    icon.arc((32, 44, 64, 76), 185, 355, width=6)
    return icon.save("privacy-user.png")


def privacy_anon() -> Path:
    icon = LineIcon()
    icon.arc((20, 32, 76, 88), 180, 360)
    icon.arc((29, 41, 67, 79), 180, 360)
    icon.arc((38, 50, 58, 70), 180, 360)
    icon.stroke([(48, 60), (48, 72)])
    return icon.save("privacy-anon.png")


def privacy_geo() -> Path:
    icon = LineIcon()
    icon.circle((30, 18, 66, 54))
    icon.stroke([(33, 47), (48, 84)])
    icon.stroke([(63, 47), (48, 84)])
    icon.circle((40, 28, 56, 44), width=6)
    icon.stroke([(20, 20), (76, 76)])
    return icon.save("privacy-geo.png")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        SOURCE = Path(sys.argv[1])
    build_character()
    for builder in (
        advantage_anonymous,
        advantage_control,
        advantage_minimum,
        privacy_data,
        privacy_user,
        privacy_anon,
        privacy_geo,
    ):
        print(builder())
