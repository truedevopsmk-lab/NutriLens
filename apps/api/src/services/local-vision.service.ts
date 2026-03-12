import sharp from "sharp";

import type { DetectedFood, VisionAnalysisResult } from "./openai-vision.service";

type RegionStats = {
  x: number;
  y: number;
  hue: number;
  saturation: number;
  lightness: number;
  brightness: number;
  variance: number;
  score: number;
};

const decodeImageDataUrl = (imageDataUrl: string) => {
  const match = imageDataUrl.match(/^data:(.*?);base64,(.*)$/);

  if (!match) {
    throw new Error("Unsupported image payload.");
  }

  return Buffer.from(match[2], "base64");
};

const rgbToHsl = (r: number, g: number, b: number) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness: lightness * 100 };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;

  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }

  return {
    hue: hue * 60,
    saturation: saturation * 100,
    lightness: lightness * 100
  };
};

const buildRegionStats = (
  data: Buffer,
  width: number,
  height: number,
  columns: number,
  rows: number
) => {
  const cellWidth = Math.floor(width / columns);
  const cellHeight = Math.floor(height / rows);
  const regions: RegionStats[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      let redTotal = 0;
      let greenTotal = 0;
      let blueTotal = 0;
      let intensityTotal = 0;
      let intensitySquaredTotal = 0;
      let count = 0;

      const startX = column * cellWidth;
      const endX = column === columns - 1 ? width : startX + cellWidth;
      const startY = row * cellHeight;
      const endY = row === rows - 1 ? height : startY + cellHeight;

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const index = (y * width + x) * 3;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const intensity = (red + green + blue) / 3;

          redTotal += red;
          greenTotal += green;
          blueTotal += blue;
          intensityTotal += intensity;
          intensitySquaredTotal += intensity * intensity;
          count += 1;
        }
      }

      const redAverage = redTotal / count;
      const greenAverage = greenTotal / count;
      const blueAverage = blueTotal / count;
      const brightness = intensityTotal / count;
      const variance = Math.sqrt(
        Math.max(intensitySquaredTotal / count - brightness * brightness, 0)
      );
      const { hue, saturation, lightness } = rgbToHsl(
        redAverage,
        greenAverage,
        blueAverage
      );
      const centerBias =
        1 - Math.min(Math.abs(column - (columns - 1) / 2), Math.abs(row - (rows - 1) / 2)) / 2;
      const score = saturation * 0.55 + variance * 1.05 + centerBias * 18;

      regions.push({
        x: column / Math.max(columns - 1, 1),
        y: row / Math.max(rows - 1, 1),
        hue,
        saturation,
        lightness,
        brightness,
        variance,
        score
      });
    }
  }

  return regions;
};

const describeRegion = (region: RegionStats): Omit<DetectedFood, "quantity" | "unit"> & {
  quantity?: number;
  unit?: string;
} | null => {
  if (region.brightness > 240 || (region.saturation < 8 && region.variance < 10)) {
    return null;
  }

  if (region.hue >= 18 && region.hue <= 42 && region.saturation > 42) {
    return {
      name: "Orange vegetable cubes",
      estimatedPortion: "1 small tray",
      quantity: 1,
      unit: "tray",
      confidence: 0.48
    };
  }

  if (region.hue >= 45 && region.hue <= 72 && region.saturation > 28) {
    if (region.y < 0.45) {
      return {
        name: "Banana or ripe fruit",
        estimatedPortion: "1 piece",
        quantity: 1,
        unit: "piece",
        confidence: 0.4
      };
    }

    return {
      name: "Egg or corn bites",
      estimatedPortion: "1 small plate",
      quantity: 1,
      unit: "plate",
      confidence: 0.38
    };
  }

  if (region.hue >= 75 && region.hue <= 165) {
    if (region.saturation > 36 && region.variance < 26) {
      return {
        name: "Green chutney",
        estimatedPortion: "1 sauce portion",
        quantity: 1,
        unit: "portion",
        confidence: 0.44
      };
    }

    if (region.brightness < 110) {
      return {
        name: "Leafy curry",
        estimatedPortion: "1 small bowl",
        quantity: 1,
        unit: "bowl",
        confidence: 0.42
      };
    }

    return {
      name: "Green vegetable side",
      estimatedPortion: "1 side serving",
      quantity: 1,
      unit: "serving",
      confidence: 0.36
    };
  }

  if (region.lightness > 66 && region.saturation < 18) {
    return {
      name: "Flatbread or steamed cakes",
      estimatedPortion: "1 plate",
      quantity: 1,
      unit: "plate",
      confidence: 0.34
    };
  }

  if (region.variance > 42) {
    return {
      name: "Mixed rice or noodles",
      estimatedPortion: "1 bowl",
      quantity: 1,
      unit: "bowl",
      confidence: 0.45
    };
  }

  if (region.brightness < 105) {
    return {
      name: "Dal or curry",
      estimatedPortion: "1 bowl",
      quantity: 1,
      unit: "bowl",
      confidence: 0.33
    };
  }

  return {
    name: "Cooked meal portion",
    estimatedPortion: "1 serving",
    quantity: 1,
    unit: "serving",
    confidence: 0.28
  };
};

const dedupeFoods = (foods: DetectedFood[]) => {
  const map = new Map<string, DetectedFood>();

  for (const food of foods) {
    const key = food.name.toLowerCase();
    const existing = map.get(key);

    if (!existing || food.confidence > existing.confidence) {
      map.set(key, food);
    }
  }

  return Array.from(map.values());
};

export const analyzeMealPhotoLocally = async (
  imageDataUrl: string,
  reason: string
): Promise<VisionAnalysisResult> => {
  const buffer = decodeImageDataUrl(imageDataUrl);
  const normalized = sharp(buffer).rotate().resize(360, 360, { fit: "cover" }).removeAlpha();
  const { data, info } = await normalized.raw().toBuffer({ resolveWithObject: true });
  const regions = buildRegionStats(data, info.width, info.height, 3, 3)
    .filter((region) => region.score > 28 && region.brightness > 18)
    .sort((left, right) => right.score - left.score);

  const foods = dedupeFoods(
    regions
      .slice(0, 5)
      .map(describeRegion)
      .filter((food): food is DetectedFood => Boolean(food))
  );

  const resolvedFoods =
    foods.length > 0
      ? foods
      : [
          {
            name: "Cooked meal portion",
            estimatedPortion: "1 serving",
            quantity: 1,
            unit: "serving",
            confidence: 0.22
          }
        ];

  return {
    foods: resolvedFoods,
    source: "local-fallback",
    notice: `Vision provider unavailable (${reason}). Generated a local draft from the image layout; review and edit before saving.`
  };
};
