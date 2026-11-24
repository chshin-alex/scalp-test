(() => {
  "use strict";

  const MODEL = window.SCALP_REFERENCE_MODEL;
  const STAGES = ["0", "1", "1+", "2", "2+", "3", "3+", "4", "4+"];
  const MIN_PATIENT_STAGE = STAGES.indexOf("2");
  const MAX_PATIENT_STAGE = STAGES.indexOf("4");
  const FEATURE_SIZE = MODEL?.featureSize || 64;
  const TOP_NEIGHBORS = 5;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function featureBin(value) {
    return clamp(Math.floor(value * 8), 0, 7);
  }

  function rgbToHue(red, green, blue) {
    const high = Math.max(red, green, blue);
    const low = Math.min(red, green, blue);
    const delta = high - low;
    if (delta === 0) return 0;
    let hue;
    if (high === red) hue = ((green - blue) / delta) % 6;
    else if (high === green) hue = ((blue - red) / delta) + 2;
    else hue = ((red - green) / delta) + 4;
    return ((hue * 60 + 360) % 360) / 360;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("사진을 불러오지 못했습니다."));
      image.src = url;
    });
  }

  async function extractFeatures(url) {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = FEATURE_SIZE;
    canvas.height = FEATURE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, FEATURE_SIZE, FEATURE_SIZE);
    const pixels = context.getImageData(0, 0, FEATURE_SIZE, FEATURE_SIZE).data;
    const total = FEATURE_SIZE * FEATURE_SIZE;
    const rHist = Array(8).fill(0);
    const gHist = Array(8).fill(0);
    const bHist = Array(8).fill(0);
    const hueHist = Array(8).fill(0);
    const lightHist = Array(8).fill(0);
    const satHist = Array(8).fill(0);
    const gray = new Float32Array(total);
    let redDominance = 0;
    let redCoverage = 0;
    let paleCoverage = 0;
    let yellowCoverage = 0;
    let lightSum = 0;
    let lightSquaredSum = 0;
    let saturationSum = 0;

    for (let index = 0, pixelIndex = 0; index < pixels.length; index += 4, pixelIndex += 1) {
      const red = pixels[index] / 255;
      const green = pixels[index + 1] / 255;
      const blue = pixels[index + 2] / 255;
      const high = Math.max(red, green, blue);
      const low = Math.min(red, green, blue);
      const light = (red + green + blue) / 3;
      const saturation = high === 0 ? 0 : (high - low) / high;
      const hue = rgbToHue(red, green, blue);

      rHist[featureBin(red)] += 1 / total;
      gHist[featureBin(green)] += 1 / total;
      bHist[featureBin(blue)] += 1 / total;
      hueHist[featureBin(hue)] += saturation / total;
      lightHist[featureBin(light)] += 1 / total;
      satHist[featureBin(saturation)] += 1 / total;
      redDominance += Math.max(0, red - ((green + blue) / 2)) / total;
      if (red > 0.31 && red > green * 1.08 && red > blue * 1.05) redCoverage += 1 / total;
      if ((light > 0.66 && saturation < 0.24) || light > 0.82) paleCoverage += 1 / total;
      if (
        red > 0.52
        && green > 0.42
        && blue < 0.62
        && red > blue * 1.10
        && green > blue * 1.04
      ) yellowCoverage += 1 / total;
      lightSum += light;
      lightSquaredSum += light * light;
      saturationSum += saturation;
      gray[pixelIndex] = (red * 0.299) + (green * 0.587) + (blue * 0.114);
    }

    let edgeTotal = 0;
    let edgeCount = 0;
    for (let y = 0; y < FEATURE_SIZE; y += 1) {
      for (let x = 0; x < FEATURE_SIZE; x += 1) {
        const index = (y * FEATURE_SIZE) + x;
        if (x + 1 < FEATURE_SIZE) {
          edgeTotal += Math.abs(gray[index] - gray[index + 1]);
          edgeCount += 1;
        }
        if (y + 1 < FEATURE_SIZE) {
          edgeTotal += Math.abs(gray[index] - gray[index + FEATURE_SIZE]);
          edgeCount += 1;
        }
      }
    }
    const lightMean = lightSum / total;
    const lightVariance = Math.max(0, (lightSquaredSum / total) - (lightMean * lightMean));
    return [
      ...rHist,
      ...gHist,
      ...bHist,
      ...hueHist,
      ...lightHist,
      ...satHist,
      redDominance,
      redCoverage,
      paleCoverage,
      yellowCoverage,
      lightMean,
      Math.sqrt(lightVariance),
      saturationSum / total,
      edgeTotal / edgeCount
    ];
  }

  function normalizedDistance(left, right) {
    return left.reduce((total, value, index) => {
      const standardDeviation = MODEL.featureStandardDeviations[index];
      const difference = (value - right[index]) / standardDeviation;
      return total + (difference * difference * MODEL.featureWeights[index]);
    }, 0);
  }

  function classifyFeatures(features) {
    const neighbors = MODEL.references
      .map((reference) => ({
        stage: reference.stage,
        stageIndex: reference.stageIndex,
        distance: normalizedDistance(features, reference.features)
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, TOP_NEIGHBORS);
    let totalWeight = 0;
    neighbors.forEach((neighbor) => {
      const weight = 1 / (Math.sqrt(neighbor.distance) + 0.15);
      totalWeight += weight;
    });
    const stageIndex = neighbors[0].stageIndex;
    const stageScore = stageIndex;
    const agreeingWeight = neighbors.reduce((sum, neighbor) => {
      const weight = 1 / (Math.sqrt(neighbor.distance) + 0.15);
      return sum + (Math.abs(neighbor.stageIndex - stageIndex) <= 1 ? weight : 0);
    }, 0);
    const distanceSignal = 1 / (1 + (Math.sqrt(neighbors[0].distance) / 5));
    const confidence = clamp(
      Math.round(((agreeingWeight / totalWeight) * 70) + (distanceSignal * 30)),
      30,
      95
    );
    return {
      stage: STAGES[stageIndex],
      stageIndex,
      stageScore,
      confidence,
      closestStages: neighbors.slice(0, 3).map((neighbor) => neighbor.stage)
    };
  }

  function qualityWarnings(features) {
    const warnings = [];
    const lightMean = features[52];
    const lightStd = features[53];
    const edgeMean = features[55];
    if (lightMean < 0.16) warnings.push("촬영 밝기가 낮음");
    if (lightMean > 0.90) warnings.push("빛 반사가 강함");
    if (lightStd < 0.055 || edgeMean < 0.022) warnings.push("초점·질감 확인 필요");
    return warnings;
  }

  function scoreFromSeverity(stageScore, featureZ, direction = 1) {
    const base = 30 - ((stageScore / 8) * 27);
    return clamp(Math.round(base - (featureZ * 1.8 * direction)), 1, 30);
  }

  async function analyzePhotos(photos) {
    if (!MODEL || MODEL.directorReferenceCount !== 39) {
      throw new Error("원장 선정 39장 기준 모델을 불러오지 못했습니다.");
    }
    const photoResults = [];
    for (const photo of photos) {
      const features = await extractFeatures(photo.url);
      photoResults.push({
        id: photo.id,
        features,
        classification: classifyFeatures(features),
        warnings: qualityWarnings(features)
      });
    }
    const stageScore = photoResults.reduce(
      (sum, result) => sum + result.classification.stageScore,
      0
    ) / photoResults.length;
    const stageIndex = clamp(Math.round(stageScore), MIN_PATIENT_STAGE, MAX_PATIENT_STAGE);
    const spread = Math.sqrt(
      photoResults.reduce(
        (sum, result) => sum + ((result.classification.stageScore - stageScore) ** 2),
        0
      ) / photoResults.length
    );
    const averageConfidence = photoResults.reduce(
      (sum, result) => sum + result.classification.confidence,
      0
    ) / photoResults.length;
    const confidence = clamp(Math.round(averageConfidence - (spread * 8)), 25, 95);
    const averageFeatures = photoResults[0].features.map((_, index) => (
      photoResults.reduce((sum, result) => sum + result.features[index], 0) / photoResults.length
    ));
    const z = (index) => (
      (averageFeatures[index] - MODEL.featureMeans[index])
      / MODEL.featureStandardDeviations[index]
    );
    return {
      stage: STAGES[stageIndex],
      confidence,
      metrics: {
        sensitivity: scoreFromSeverity(stageScore, z(48)),
        scale: scoreFromSeverity(stageScore, (z(50) + z(51)) / 2),
        oil: scoreFromSeverity(stageScore, z(51))
      },
      warnings: [...new Set(photoResults.flatMap((result) => result.warnings))],
      photoResults
    };
  }

  window.ScalpClassifier = Object.freeze({
    analyzePhotos,
    extractFeatures,
    modelVersion: MODEL?.version || "MODEL-NOT-LOADED",
    referenceCount: MODEL?.referenceCount || 0,
    directorReferenceCount: MODEL?.directorReferenceCount || 0
  });
})();
