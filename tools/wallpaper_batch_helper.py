#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

from PIL import Image

SITE_FREE_IDS = ["free01", "free02"]
EXT_FREE_IDS = ["ext_free_01", "ext_free_02"]
SITE_FREE_PHOTO_COUNT = 6
EXT_FREE_PHOTO_COUNT = 2
SITE_PHOTO_PREFIX = "v2_"
EXT_PHOTO_PREFIX = "extv3_"
SITE_LUX_PREFIX = "lux_"
EXT_LUX_PREFIX = "lux_ext_"


@dataclass
class CatalogSummary:
    site_free: list[str]
    site_photo: list[str]
    site_lux: list[str]
    ext_free: list[str]
    ext_photo: list[str]
    ext_lux: list[str]

    @property
    def next_site_photo(self) -> str:
        last = max((extract_number(x, SITE_PHOTO_PREFIX) for x in self.site_photo), default=0)
        return f"{SITE_PHOTO_PREFIX}{last + 1:03d}"

    @property
    def next_ext_photo(self) -> str:
        last = max((extract_number(x, EXT_PHOTO_PREFIX) for x in self.ext_photo), default=0)
        return f"{EXT_PHOTO_PREFIX}{last + 1:02d}"


def script_root() -> Path:
    return Path(__file__).resolve().parents[1]


def assets_root(root: Path) -> Path:
    return root / "assets"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value or "wallpaper"


def titleize_slug(slug: str) -> str:
    return slug.replace("_", " ").title()


def extract_number(wallpaper_id: str, prefix: str) -> int:
    m = re.fullmatch(re.escape(prefix) + r"(\d+)", wallpaper_id)
    return int(m.group(1)) if m else 0


def sorted_ids(ids: Iterable[str], prefix: str) -> list[str]:
    return sorted(ids, key=lambda x: extract_number(x, prefix))


def scan_catalog(root: Path) -> CatalogSummary:
    assets = assets_root(root)
    site_dir = assets / "wallpapers"
    ext_dir = assets / "extbg"

    site_free = []
    site_photo = []
    site_lux = []
    ext_free = []
    ext_photo = []
    ext_lux = []

    for f in site_dir.iterdir():
        if not f.is_file():
            continue
        name = f.name
        stem = f.stem
        if re.fullmatch(r"free\d{2}", stem) and f.suffix.lower() == ".svg":
            site_free.append(stem)
        elif re.fullmatch(r"v2_\d{3}", stem) and f.suffix.lower() == ".webp":
            site_photo.append(stem)
        elif stem.startswith(SITE_LUX_PREFIX) and f.suffix.lower() == ".svg":
            site_lux.append(stem)

    for f in ext_dir.iterdir():
        if not f.is_file():
            continue
        stem = f.stem
        if re.fullmatch(r"ext_free_\d{2}", stem) and f.suffix.lower() == ".svg":
            ext_free.append(stem)
        elif re.fullmatch(r"extv3_\d{2}", stem) and f.suffix.lower() == ".webp":
            ext_photo.append(stem)
        elif stem.startswith(EXT_LUX_PREFIX) and f.suffix.lower() == ".svg":
            ext_lux.append(stem)

    return CatalogSummary(
        site_free=sorted(site_free),
        site_photo=sorted_ids(site_photo, SITE_PHOTO_PREFIX),
        site_lux=sorted(site_lux),
        ext_free=sorted(ext_free),
        ext_photo=sorted_ids(ext_photo, EXT_PHOTO_PREFIX),
        ext_lux=sorted(ext_lux),
    )


def build_site_catalog(summary: CatalogSummary) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for wid in summary.site_free:
        name = {
            "free01": "Free — Solana Waves",
            "free02": "Free — Solflare Glow",
        }.get(wid, f"Free — {wid}")
        rows.append({"id": wid, "name": name, "tier": "free"})
    for wid in summary.site_photo:
        num = extract_number(wid, SITE_PHOTO_PREFIX)
        tier = "free" if num <= SITE_FREE_PHOTO_COUNT else "premium"
        rows.append({"id": wid, "name": f"Photo Pack #{num:03d}", "tier": tier})
    for wid in summary.site_lux:
        rows.append({"id": wid, "name": titleize_slug(wid[len(SITE_LUX_PREFIX):]), "tier": "premium"})
    return rows


def build_ext_catalog(summary: CatalogSummary) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for wid in summary.ext_free:
        num = extract_number(wid, "ext_free_")
        rows.append({"id": wid, "name": f"Free {num:02d}", "tier": "free"})
    for wid in summary.ext_photo:
        num = extract_number(wid, EXT_PHOTO_PREFIX)
        tier = "free" if num <= EXT_FREE_PHOTO_COUNT else "premium"
        rows.append({"id": wid, "name": f"Photo Pack {num}", "tier": tier})
    for wid in summary.ext_lux:
        rows.append({"id": wid, "name": titleize_slug(wid[len(EXT_LUX_PREFIX):]), "tier": "premium"})
    return rows


def write_js_snippet(path: Path, const_name: str, rows: list[dict[str, str]]) -> None:
    lines = [f"const {const_name} = ["]
    for row in rows:
        lines.append(f'  {{ id:"{row["id"]}", name:"{row["name"]}", tier:"{row["tier"]}" }},')
    lines.append("];\n")
    path.write_text("\n".join(lines), encoding="utf-8")


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ensure_rgb(image: Image.Image) -> Image.Image:
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA")
    if image.mode == "RGBA":
        bg = Image.new("RGB", image.size, (18, 18, 24))
        bg.paste(image, mask=image.getchannel("A"))
        return bg
    return image


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    w, h = image.size
    tw, th = size
    if w == 0 or h == 0:
        raise ValueError("Invalid source image size")
    src_ratio = w / h
    dst_ratio = tw / th
    if src_ratio > dst_ratio:
        new_h = th
        new_w = round(th * src_ratio)
    else:
        new_w = tw
        new_h = round(tw / src_ratio)
    image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = max((new_w - tw) // 2, 0)
    top = max((new_h - th) // 2, 0)
    return image.crop((left, top, left + tw, top + th))


def import_photo(root: Path, source_files: list[Path], kind: str) -> list[str]:
    summary = scan_catalog(root)
    assets = assets_root(root)
    if kind == "site":
        next_num = extract_number(summary.next_site_photo, SITE_PHOTO_PREFIX)
        full_dir = assets / "wallpapers"
        thumb_dir = assets / "wallpapers" / "thumbs"
        prefix = SITE_PHOTO_PREFIX
        full_size = (1920, 1080)
        thumb_size = (480, 270)
        width = 3
    else:
        next_num = extract_number(summary.next_ext_photo, EXT_PHOTO_PREFIX)
        full_dir = assets / "extbg"
        thumb_dir = assets / "extbg" / "thumbs"
        prefix = EXT_PHOTO_PREFIX
        full_size = (1600, 900)
        thumb_size = (400, 225)
        width = 2

    thumb_dir.mkdir(parents=True, exist_ok=True)
    created: list[str] = []
    for src in source_files:
        wallpaper_id = f"{prefix}{next_num:0{width}d}"
        next_num += 1
        dest_full = full_dir / f"{wallpaper_id}.webp"
        dest_thumb = thumb_dir / f"{wallpaper_id}.webp"
        with Image.open(src) as im:
            im = ensure_rgb(im)
            fit_cover(im, full_size).save(dest_full, format="WEBP", quality=88, method=6)
            fit_cover(im, thumb_size).save(dest_thumb, format="WEBP", quality=82, method=6)
        created.append(wallpaper_id)
    return created


def import_svg(root: Path, source_file: Path, kind: str, slug: str) -> str:
    slug = slugify(slug)
    assets = assets_root(root)
    if kind == "site":
        wallpaper_id = f"{SITE_LUX_PREFIX}{slug}"
        dest = assets / "wallpapers" / f"{wallpaper_id}.svg"
    else:
        wallpaper_id = f"{EXT_LUX_PREFIX}{slug}"
        dest = assets / "extbg" / f"{wallpaper_id}.svg"
    shutil.copy2(source_file, dest)
    return wallpaper_id


def write_docs(root: Path) -> None:
    summary = scan_catalog(root)
    docs = root / "docs"
    generated = docs / "generated"
    generated.mkdir(parents=True, exist_ok=True)

    site_rows = build_site_catalog(summary)
    ext_rows = build_ext_catalog(summary)
    write_js_snippet(generated / "site_wallpapers_snippet.js", "WALLPAPERS", site_rows)
    write_js_snippet(generated / "ext_wallpapers_snippet.js", "EXT_WALLPAPERS", ext_rows)
    write_json(generated / "wallpaper_inventory.json", {
        "site": {
            "free": summary.site_free,
            "photo": summary.site_photo,
            "lux": summary.site_lux,
            "next_photo_id": summary.next_site_photo,
        },
        "extension": {
            "free": summary.ext_free,
            "photo": summary.ext_photo,
            "lux": summary.ext_lux,
            "next_photo_id": summary.next_ext_photo,
        },
    })

    report = f"""GMXReply wallpaper inventory\n\nCanonical source folders\n- Backend/assets/wallpapers\n- Backend/assets/wallpapers/thumbs\n- Backend/assets/extbg\n- Backend/assets/extbg/thumbs\n\nCurrent counts\n- Site free SVG: {len(summary.site_free)}\n- Site photo WEBP: {len(summary.site_photo)}\n- Site crypto/lux SVG: {len(summary.site_lux)}\n- Extension free SVG: {len(summary.ext_free)}\n- Extension photo WEBP: {len(summary.ext_photo)}\n- Extension crypto/lux SVG: {len(summary.ext_lux)}\n\nNext IDs\n- Site photo: {summary.next_site_photo}\n- Extension photo: {summary.next_ext_photo}\n\nFree unlock convention\n- Site photos: first {SITE_FREE_PHOTO_COUNT} photo wallpapers are free\n- Extension photos: first {EXT_FREE_PHOTO_COUNT} photo wallpapers are free\n- free01/free02 and ext_free_01/ext_free_02 stay free\n- lux_* and lux_ext_* stay premium\n"""
    (docs / "WALLPAPER_CURRENT_INVENTORY_R42.txt").write_text(report, encoding="utf-8")


def print_report(root: Path) -> None:
    summary = scan_catalog(root)
    payload = {
        "site_free": len(summary.site_free),
        "site_photo": len(summary.site_photo),
        "site_lux": len(summary.site_lux),
        "ext_free": len(summary.ext_free),
        "ext_photo": len(summary.ext_photo),
        "ext_lux": len(summary.ext_lux),
        "next_site_photo": summary.next_site_photo,
        "next_ext_photo": summary.next_ext_photo,
    }
    print(json.dumps(payload, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="GMXReply wallpaper helper")
    parser.add_argument("command", choices=["report", "write-docs", "import-photo", "import-svg"], help="Action")
    parser.add_argument("--root", default=None, help="Backend root. Defaults to repo Backend folder.")
    parser.add_argument("--kind", choices=["site", "ext"], help="Wallpaper target group")
    parser.add_argument("--slug", help="Slug for SVG import")
    parser.add_argument("sources", nargs="*", help="Source files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve() if args.root else script_root()
    if args.command == "report":
        print_report(root)
        return 0
    if args.command == "write-docs":
        write_docs(root)
        print("Docs generated")
        return 0
    if args.command == "import-photo":
        if not args.kind or not args.sources:
            raise SystemExit("import-photo requires --kind and one or more source files")
        created = import_photo(root, [Path(x).resolve() for x in args.sources], args.kind)
        write_docs(root)
        print(json.dumps({"created": created}, indent=2))
        return 0
    if args.command == "import-svg":
        if not args.kind or not args.slug or len(args.sources) != 1:
            raise SystemExit("import-svg requires --kind, --slug and exactly one source file")
        created = import_svg(root, Path(args.sources[0]).resolve(), args.kind, args.slug)
        write_docs(root)
        print(json.dumps({"created": created}, indent=2))
        return 0
    raise SystemExit("Unknown command")


if __name__ == "__main__":
    raise SystemExit(main())
