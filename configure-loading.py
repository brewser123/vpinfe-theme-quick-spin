#!/usr/bin/env python3
"""Set Quick Spin's optional loading image and rotation from SSH."""

import argparse
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parent
SCHEMA = ROOT / "theme.json"
IMAGE_DIR = ROOT / "img"
MAX_BYTES = 3 * 1024 * 1024
MAX_SIDE = 1920
MAX_PIXELS = 2_100_000
NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}\.(png|jpe?g|webp|gif)$", re.I)
FORMATS = {"PNG", "JPEG", "WEBP", "GIF"}
FORMAT_FOR_SUFFIX = {".png": "PNG", ".jpg": "JPEG", ".jpeg": "JPEG", ".webp": "WEBP", ".gif": "GIF"}


def validate_image(source: Path) -> None:
    if not source.is_file():
        raise ValueError(f"Image not found: {source}")
    if not NAME.fullmatch(source.name):
        raise ValueError("Use a simple PNG, JPG, WebP or GIF filename (no spaces or folders in the name).")
    if source.stat().st_size > MAX_BYTES:
        raise ValueError("Image exceeds 3 MiB.")
    try:
        from PIL import Image
    except ImportError as exc:
        raise ValueError("Pillow is required for the setup helper; the theme itself does not need it.") from exc
    with Image.open(source) as image:
        width, height = image.size
        if image.format not in FORMATS or image.format != FORMAT_FOR_SUFFIX[source.suffix.lower()]:
            raise ValueError("Image contents are not PNG, JPG, WebP or GIF.")
        if not 0 < width <= MAX_SIDE or not 0 < height <= MAX_SIDE or width * height > MAX_PIXELS:
            raise ValueError("Image exceeds 1920 pixels per side or 2.1 million pixels total.")
        image.verify()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, help="Local image file to copy into Quick Spin")
    parser.add_argument("--rotate", choices=("0", "90", "180", "270"), help="Clockwise rotation in degrees")
    parser.add_argument("--clear", action="store_true", help="Use the built-in loading screen")
    args = parser.parse_args()
    if args.clear and args.file:
        parser.error("Choose --clear or --file, not both.")

    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    options = {option["key"]: option for option in schema["options"]}
    if args.file:
        source = args.file.expanduser().resolve()
        validate_image(source)
        IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        destination = IMAGE_DIR / source.name
        if source != destination.resolve():
            if destination.exists():
                raise ValueError(f"Destination already exists: {destination}")
            shutil.copy2(source, destination)
        options["loading_image"]["value"] = source.name
    elif args.clear:
        options["loading_image"]["value"] = ""

    if args.rotate is not None:
        options["loading_rotation"]["value"] = args.rotate
    if args.file or args.clear or args.rotate is not None:
        temporary = SCHEMA.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
        temporary.replace(SCHEMA)

    print("Loading image:", options["loading_image"]["value"] or "built-in")
    print("Rotation:", options["loading_rotation"]["value"] + "°")
    if args.file or args.clear or args.rotate is not None:
        print("Restart VPinFE to apply the change.")


if __name__ == "__main__":
    main()
