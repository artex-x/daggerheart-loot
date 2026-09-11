#!/usr/bin/env python3
"""Install a completed artwork manifest into daggerheart-loot assets."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps, features


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    return parser.parse_args()


def flatten_records(data: dict[str, Any]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for group in data["items"].values():
        records.extend(group)
    records.extend(data["eq"])
    return records


def accepted_items(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    return [item for batch in manifest["batches"] for item in batch["items"]]


def load_rgb(source: Path) -> Image.Image:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.load()
        if image.width != image.height:
            raise ValueError(f"{source}: non-square input {image.size}")
        if "A" in image.getbands():
            alpha = image.getchannel("A")
            if alpha.getextrema() != (255, 255):
                raise ValueError(f"{source}: input contains transparency")
        return image.convert("RGB")


def encode(image: Image.Image, kind: str) -> bytes:
    resized = image.resize((640, 640), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    if kind == "webp":
        resized.save(output, format="WEBP", quality=85, method=6)
    elif kind == "jpeg":
        resized.save(
            output,
            format="JPEG",
            quality=80,
            progressive=True,
            subsampling="4:2:0",
            optimize=True,
        )
    else:
        raise ValueError(kind)
    return output.getvalue()


def validate_encoded(payload: bytes, expected_format: str) -> None:
    with Image.open(io.BytesIO(payload)) as image:
        image.load()
        if image.format != expected_format or image.mode != "RGB" or image.size != (640, 640):
            raise ValueError(
                f"bad encoded asset: format={image.format}, mode={image.mode}, size={image.size}"
            )


def atomic_write(destination: Path, payload: bytes) -> None:
    temporary = destination.with_name(destination.name + ".dh-image-polish.tmp")
    temporary.write_bytes(payload)
    os.replace(temporary, destination)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    args = parse_args()
    if not features.check("webp") or not features.check("jpg"):
        raise RuntimeError("Pillow lacks the required WebP or JPEG encoder")

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    items = accepted_items(manifest)
    if manifest.get("status") != "complete":
        raise ValueError("approval manifest is not complete")
    if manifest.get("accepted_count") != len(items) or manifest.get("remaining_count") != 0:
        raise ValueError("approval manifest counts are inconsistent")

    data = json.loads((args.repo / "data.json").read_text(encoding="utf-8"))
    records = flatten_records(data)
    by_id: dict[str, list[dict[str, Any]]] = {}
    for record in records:
        by_id.setdefault(record["id"], []).append(record)

    mappings: list[tuple[dict[str, Any], Path, Path, Path]] = []
    destinations: dict[Path, Path] = {}
    for item in items:
        source = args.source_root / item["accepted_file"]
        if not source.is_file():
            raise FileNotFoundError(source)
        matches = by_id.get(item["id"], [])
        if len(matches) != 1:
            raise ValueError(f"{item['id']}: expected one record, found {len(matches)}")
        asset = matches[0].get("img")
        if not asset:
            raise ValueError(f"{item['id']}: record has no image mapping")
        webp = args.repo / "img" / asset
        jpeg = args.repo / "og" / Path(asset).with_suffix(".jpg")
        if not webp.is_file() or not jpeg.is_file():
            raise FileNotFoundError(f"{item['id']}: missing existing pair {webp}, {jpeg}")
        previous = destinations.setdefault(webp, source)
        if previous != source:
            raise ValueError(f"conflicting approved sources for {webp}")
        mappings.append((item, source, webp, jpeg))

    source_hashes: set[str] = set()
    prepared: list[tuple[dict[str, Any], Path, Path, Path, bytes, bytes]] = []
    for item, source, webp, jpeg in mappings:
        source_hash = sha256(source)
        if source_hash in source_hashes:
            raise ValueError(f"duplicate accepted source bytes: {source}")
        source_hashes.add(source_hash)
        image = load_rgb(source)
        webp_bytes = encode(image, "webp")
        jpeg_bytes = encode(image, "jpeg")
        validate_encoded(webp_bytes, "WEBP")
        validate_encoded(jpeg_bytes, "JPEG")
        prepared.append((item, source, webp, jpeg, webp_bytes, jpeg_bytes))

    for _, _, webp, jpeg, webp_bytes, jpeg_bytes in prepared:
        atomic_write(webp, webp_bytes)
        atomic_write(jpeg, jpeg_bytes)

    for item, source, webp, jpeg, webp_bytes, jpeg_bytes in prepared:
        image = load_rgb(source)
        if webp.read_bytes() != webp_bytes or webp.read_bytes() != encode(image, "webp"):
            raise ValueError(f"{item['id']}: WebP deterministic verification failed")
        if jpeg.read_bytes() != jpeg_bytes or jpeg.read_bytes() != encode(image, "jpeg"):
            raise ValueError(f"{item['id']}: JPEG deterministic verification failed")
        print(
            f"{item['id']}|{Path(item['accepted_file']).name}|{webp.name}|"
            f"{sha256(webp)[:16]}|{sha256(jpeg)[:16]}"
        )

    print(f"accepted={len(items)} asset_pairs={len(destinations)} record_links={len(mappings)}")


if __name__ == "__main__":
    main()
