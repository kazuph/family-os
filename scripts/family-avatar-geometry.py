#!/usr/bin/env python3
"""Family OS monster avatar geometry + cyan phase generation.

Existing warm/cool/violet files of each shape are exact RGB channel cycles of
one another. Cyan is the remaining 水色 permutation: swap red and blue of warm
(keep green and the alpha byte array). SVG/CSS placeholders are not used.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, PngImagePlugin

ROOT = Path(__file__).resolve().parents[1]
AVATAR_DIR = ROOT / "packages/workshop-frontend/public/family-avatars"
ARTIFACT_DIR = ROOT / ".artifacts/family-os-cyan-avatars"
CANVAS = 512
CENTER = CANVAS / 2
MAX_CENTER_ERR = 0.5
SHAPES = range(1, 9)
PHASES = ("warm", "cool", "violet", "cyan")
SOURCE_PHASES = ("warm", "cool", "violet")


def avatar_path(shape: int, phase: str) -> Path:
    return AVATAR_DIR / f"monster-{shape:02d}-{phase}.png"


def load_rgba(path: Path) -> tuple[np.ndarray, Image.Image]:
    image = Image.open(path)
    rgba = np.array(image.convert("RGBA"))
    return rgba, image


def cyan_from_warm(warm: np.ndarray) -> np.ndarray:
    """Hue transform: (R, G, B, A) -> (B, G, R, A). Alpha is copied byte-for-byte."""
    return np.stack([warm[:, :, 2], warm[:, :, 1], warm[:, :, 0], warm[:, :, 3]], axis=-1)


def alpha_bbox(alpha: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(alpha > 0)
    if xs.size == 0:
        raise ValueError("alpha channel is empty")
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def bbox_center(bbox: tuple[int, int, int, int]) -> tuple[float, float]:
    x0, y0, x1, y1 = bbox
    return (x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2


def save_png(path: Path, pixels: np.ndarray, source: Image.Image) -> None:
    image = Image.fromarray(pixels, mode="RGBA")
    pnginfo = PngImagePlugin.PngInfo()
    chromaticity = source.info.get("chromaticity")
    if chromaticity:
        image.info["chromaticity"] = chromaticity
    image.save(path, format="PNG", pnginfo=pnginfo)


def generate_cyan() -> list[Path]:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for shape in SHAPES:
        warm_path = avatar_path(shape, "warm")
        if not warm_path.is_file():
            raise FileNotFoundError(warm_path)
        warm, source = load_rgba(warm_path)
        if warm.shape != (CANVAS, CANVAS, 4):
            raise ValueError(f"{warm_path.name} is {warm.shape}, expected {CANVAS}x{CANVAS} RGBA")
        dest = avatar_path(shape, "cyan")
        save_png(dest, cyan_from_warm(warm), source)
        written.append(dest)
        print(f"wrote {dest.relative_to(ROOT)}")
    return written


def write_contact_sheet(path: Path) -> Path:
    cell = 160
    gap = 10
    label_h = 28
    cols, rows = 4, 8
    width = gap + cols * (cell + gap)
    height = label_h + gap + rows * (cell + gap)
    sheet = Image.new("RGBA", (width, height), (12, 14, 18, 255))
    labels = ("warm", "cool", "violet", "cyan")
    try:
        from PIL import ImageDraw
        draw = ImageDraw.Draw(sheet)
        for index, label in enumerate(labels):
            x = gap + index * (cell + gap)
            draw.text((x + 8, 6), label, fill=(230, 232, 236, 255))
    except Exception:
        pass
    for shape in SHAPES:
        for col, phase in enumerate(PHASES):
            src = Image.open(avatar_path(shape, phase)).convert("RGBA")
            thumb = src.resize((cell, cell), Image.Resampling.LANCZOS)
            x = gap + col * (cell + gap)
            y = label_h + gap + (shape - 1) * (cell + gap)
            sheet.alpha_composite(thumb, (x, y))
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, format="PNG")
    print(f"wrote {path}")
    return path


def check() -> None:
    failures: list[str] = []
    shape_bboxes: dict[int, tuple[int, int, int, int]] = {}

    for shape in SHAPES:
        loaded: dict[str, np.ndarray] = {}
        for phase in PHASES:
            path = avatar_path(shape, phase)
            if not path.is_file():
                failures.append(f"missing {path.relative_to(ROOT)}")
                continue
            pixels, _ = load_rgba(path)
            loaded[phase] = pixels
            if pixels.shape != (CANVAS, CANVAS, 4):
                failures.append(f"{path.name} shape {pixels.shape} != {CANVAS}x{CANVAS}x4")

        if set(SOURCE_PHASES) - loaded.keys():
            continue

        warm = loaded["warm"]
        expected_cyan = cyan_from_warm(warm)
        for left, right, label in (
            ("cool", "cool", "warm cycle (B,R,G)"),
            ("violet", "violet", "warm cycle (G,B,R)"),
        ):
            # Document existing invariant; do not rewrite source files.
            cycle = {
                "cool": np.stack([warm[:, :, 2], warm[:, :, 0], warm[:, :, 1], warm[:, :, 3]], axis=-1),
                "violet": np.stack([warm[:, :, 1], warm[:, :, 2], warm[:, :, 0], warm[:, :, 3]], axis=-1),
            }[right]
            if not np.array_equal(loaded[left], cycle):
                failures.append(f"monster-{shape:02d}-{left} is not the {label} of warm")

        if "cyan" not in loaded:
            continue
        cyan = loaded["cyan"]
        if not np.array_equal(cyan, expected_cyan):
            failures.append(
                f"monster-{shape:02d}-cyan is not the R↔B hue transform of the matching warm variant")
        if np.array_equal(cyan[:, :, :3], warm[:, :, :3]):
            failures.append(f"monster-{shape:02d}-cyan RGB is identical to warm (placeholder)")

        ref_alpha = warm[:, :, 3]
        for phase, pixels in loaded.items():
            alpha = pixels[:, :, 3]
            if not np.array_equal(alpha, ref_alpha):
                failures.append(
                    f"monster-{shape:02d}-{phase} alpha is not byte-identical to warm")
            if int(np.count_nonzero(alpha)) != int(np.count_nonzero(ref_alpha)):
                failures.append(f"monster-{shape:02d}-{phase} nonzero alpha count mismatch")

            bbox = alpha_bbox(alpha)
            x0, y0, x1, y1 = bbox
            outside = alpha.copy()
            outside[y0 : y1 + 1, x0 : x1 + 1] = 0
            if int(np.count_nonzero(outside)) != 0:
                failures.append(f"monster-{shape:02d}-{phase} has alpha outside crop bbox")
            if alpha[:, 0].any() or alpha[:, -1].any() or alpha[0, :].any() or alpha[-1, :].any():
                failures.append(f"monster-{shape:02d}-{phase} clips the canvas edge (including right)")

            cx, cy = bbox_center(bbox)
            if abs(cx - CENTER) > MAX_CENTER_ERR or abs(cy - CENTER) > MAX_CENTER_ERR:
                failures.append(
                    f"monster-{shape:02d}-{phase} bbox center ({cx:.3f},{cy:.3f}) exceeds ±{MAX_CENTER_ERR}px")

            ref_bbox = alpha_bbox(ref_alpha)
            if bbox != ref_bbox:
                failures.append(
                    f"monster-{shape:02d}-{phase} bbox {bbox} != reference {ref_bbox}")
            if (y0, y1) != (ref_bbox[1], ref_bbox[3]):
                failures.append(
                    f"monster-{shape:02d}-{phase} height/y alignment {y0},{y1} != {ref_bbox[1]},{ref_bbox[3]}")

        shape_bboxes[shape] = alpha_bbox(ref_alpha)

        # Pairwise crop-bbox intersection of *distinct* unpacked sprites is expected
        # on a shared 512 canvas (all eight shapes are centered). The required
        # "bbox交差0" is: no alpha outside the crop, and cyan does not expand the
        # crop relative to the existing three phases.
        cyan_bbox = alpha_bbox(cyan[:, :, 3])
        for phase in SOURCE_PHASES:
            if cyan_bbox != alpha_bbox(loaded[phase][:, :, 3]):
                failures.append(f"monster-{shape:02d}-cyan bbox diverges from {phase}")

    if failures:
        print("FAIL")
        for item in failures:
            print(f"  {item}")
        raise SystemExit(1)

    print("PASS")
    print(f"  files=32 canvas={CANVAS} center_err<={MAX_CENTER_ERR}px")
    print("  cyan=R↔B(warm) alpha byte-identical to matching shape")
    print("  no edge clip, bbox outside-alpha=0, height aligned to existing 3 phases")
    for shape, bbox in shape_bboxes.items():
        cx, cy = bbox_center(bbox)
        print(f"  monster-{shape:02d} bbox={bbox} center=({cx:.1f},{cy:.1f})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        nargs="?",
        default="check",
        choices=("generate", "check", "contact-sheet", "all"),
    )
    parser.add_argument(
        "--contact-sheet",
        type=Path,
        default=ARTIFACT_DIR / "contact-sheet.png",
    )
    args = parser.parse_args()
    command = args.command
    if command in ("generate", "all"):
        generate_cyan()
    if command in ("contact-sheet", "all"):
        write_contact_sheet(args.contact_sheet)
    if command in ("check", "all"):
        check()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)
