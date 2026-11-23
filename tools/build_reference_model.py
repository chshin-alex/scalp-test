#!/usr/bin/env python3
"""Build a browser-side reference model from the director-reviewed scalp photos."""

from __future__ import annotations

import argparse
import colorsys
import json
import math
from pathlib import Path

from PIL import Image, ImageOps


STAGES = ("1", "1+", "2", "2+", "3", "3+", "4", "4+")
REPRESENTATIVE_NAMES = {
    "1": "stage-1.jpg",
    "1+": "stage-1-plus.jpg",
    "2": "stage-2.jpg",
    "2+": "stage-2-plus.jpg",
    "3": "stage-3.jpg",
    "3+": "stage-3-plus.jpg",
    "4": "stage-4.jpg",
    "4+": "stage-4-plus.jpg",
}
FEATURE_SIZE = 64


def clamp_bin(value: float) -> int:
    return min(7, max(0, int(value * 8)))


def extract_features(path: Path) -> list[float]:
    image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    image = ImageOps.fit(
        image,
        (FEATURE_SIZE, FEATURE_SIZE),
        method=Image.Resampling.LANCZOS,
    )
    pixels = list(image.get_flattened_data())
    total = len(pixels)

    r_hist = [0.0] * 8
    g_hist = [0.0] * 8
    b_hist = [0.0] * 8
    hue_hist = [0.0] * 8
    light_hist = [0.0] * 8
    sat_hist = [0.0] * 8
    red_dominance = 0.0
    red_coverage = 0.0
    pale_coverage = 0.0
    yellow_coverage = 0.0
    lights: list[float] = []
    saturations: list[float] = []
    grays: list[float] = []

    for red_byte, green_byte, blue_byte in pixels:
        red = red_byte / 255
        green = green_byte / 255
        blue = blue_byte / 255
        high = max(red, green, blue)
        low = min(red, green, blue)
        light = (red + green + blue) / 3
        saturation = 0 if high == 0 else (high - low) / high
        hue = colorsys.rgb_to_hsv(red, green, blue)[0]

        r_hist[clamp_bin(red)] += 1 / total
        g_hist[clamp_bin(green)] += 1 / total
        b_hist[clamp_bin(blue)] += 1 / total
        hue_hist[clamp_bin(hue)] += saturation / total
        light_hist[clamp_bin(light)] += 1 / total
        sat_hist[clamp_bin(saturation)] += 1 / total
        red_dominance += max(0, red - ((green + blue) / 2)) / total
        red_coverage += (
            1 / total
            if red > 0.31 and red > green * 1.08 and red > blue * 1.05
            else 0
        )
        pale_coverage += (
            1 / total
            if (light > 0.66 and saturation < 0.24) or light > 0.82
            else 0
        )
        yellow_coverage += (
            1 / total
            if red > 0.52
            and green > 0.42
            and blue < 0.62
            and red > blue * 1.10
            and green > blue * 1.04
            else 0
        )
        lights.append(light)
        saturations.append(saturation)
        grays.append((red * 0.299) + (green * 0.587) + (blue * 0.114))

    light_mean = sum(lights) / total
    light_std = math.sqrt(sum((value - light_mean) ** 2 for value in lights) / total)
    sat_mean = sum(saturations) / total
    edge_total = 0.0
    edge_count = 0
    for y in range(FEATURE_SIZE):
        for x in range(FEATURE_SIZE):
            index = (y * FEATURE_SIZE) + x
            if x + 1 < FEATURE_SIZE:
                edge_total += abs(grays[index] - grays[index + 1])
                edge_count += 1
            if y + 1 < FEATURE_SIZE:
                edge_total += abs(grays[index] - grays[index + FEATURE_SIZE])
                edge_count += 1
    edge_mean = edge_total / edge_count

    return [
        *r_hist,
        *g_hist,
        *b_hist,
        *hue_hist,
        *light_hist,
        *sat_hist,
        red_dominance,
        red_coverage,
        pale_coverage,
        yellow_coverage,
        light_mean,
        light_std,
        sat_mean,
        edge_mean,
    ]


def feature_weights() -> list[float]:
    return [
        *([0.45] * 24),
        *([0.55] * 8),
        *([0.45] * 8),
        *([0.45] * 8),
        3.2,
        2.8,
        2.8,
        2.0,
        0.8,
        1.0,
        0.8,
        1.5,
    ]


def save_public_asset(source: Path, destination: Path) -> None:
    image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "JPEG", quality=92, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("reference_root", type=Path)
    parser.add_argument("project_root", type=Path)
    args = parser.parse_args()

    healthy_reference = args.project_root / "assets" / "stage-0.jpg"
    if not healthy_reference.exists():
        raise ValueError("0단계 건강 참고사진을 찾지 못했습니다.")
    records = [
        {
            "id": "ref-0-01",
            "stage": "0",
            "stageIndex": 0,
            "features": extract_features(healthy_reference),
        }
    ]
    stage_counts = {"0": 1}
    for stage_index, stage in enumerate(STAGES, start=1):
        stage_dir = args.reference_root / f"{stage}단계"
        photos = sorted(stage_dir.glob("*.jpg"))
        expected = 4 if stage == "4+" else 5
        if len(photos) != expected:
            raise ValueError(f"{stage}단계: expected {expected} photos, found {len(photos)}")
        stage_counts[stage] = len(photos)
        for photo_index, photo in enumerate(photos, start=1):
            records.append(
                {
                    "id": f"ref-{stage.replace('+', 'p')}-{photo_index:02d}",
                    "stage": stage,
                    "stageIndex": stage_index,
                    "features": extract_features(photo),
                }
            )

        representative = next(
            (photo for photo in photos if photo.name.startswith(f"{stage}_1_")),
            None,
        )
        if representative is None:
            raise ValueError(f"{stage}단계 대표사진을 찾지 못했습니다.")
        save_public_asset(
            representative,
            args.project_root / "assets" / REPRESENTATIVE_NAMES[stage],
        )

    feature_count = len(records[0]["features"])
    means = []
    standard_deviations = []
    for index in range(feature_count):
        values = [record["features"][index] for record in records]
        mean = sum(values) / len(values)
        variance = sum((value - mean) ** 2 for value in values) / len(values)
        means.append(mean)
        standard_deviations.append(max(math.sqrt(variance), 0.0001))

    model = {
        "version": "DIRECTOR-REFERENCE-KNN-39-v1",
        "referenceCount": len(records),
        "directorReferenceCount": len(records) - 1,
        "stageCounts": stage_counts,
        "featureSize": FEATURE_SIZE,
        "featureMeans": means,
        "featureStandardDeviations": standard_deviations,
        "featureWeights": feature_weights(),
        "references": records,
    }

    exact = 0
    within_one = 0
    for record in records:
        best = None
        for candidate in records:
            if candidate["id"] == record["id"]:
                continue
            distance = 0.0
            for index, weight in enumerate(model["featureWeights"]):
                left = (record["features"][index] - means[index]) / standard_deviations[index]
                right = (candidate["features"][index] - means[index]) / standard_deviations[index]
                distance += ((left - right) ** 2) * weight
            if best is None or distance < best[0]:
                best = (distance, candidate)
        predicted = best[1]["stageIndex"]
        exact += int(predicted == record["stageIndex"])
        within_one += int(abs(predicted - record["stageIndex"]) <= 1)

    output = args.project_root / "reference-model.js"
    output.write_text(
        "window.SCALP_REFERENCE_MODEL = "
        + json.dumps(model, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Built {len(records)} reference vectors -> {output}")
    print(
        "Leave-one-out nearest reference: "
        f"exact={exact}/{len(records)}, within-one={within_one}/{len(records)}"
    )


if __name__ == "__main__":
    main()
