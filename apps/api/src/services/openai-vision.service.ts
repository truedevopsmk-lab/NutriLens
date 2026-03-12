import OpenAI from "openai";
import { z } from "zod";

import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { analyzeMealPhotoLocally } from "./local-vision.service";

const detectedFoodSchema = z.object({
  name: z.string().min(1),
  estimatedPortion: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  confidence: z.number().min(0).max(1)
});

const responseSchema = z.object({
  foods: z.array(detectedFoodSchema).min(1)
});

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export type DetectedFood = z.infer<typeof detectedFoodSchema>;
export type VisionAnalysisResult = {
  foods: DetectedFood[];
  source: "openai" | "local-fallback";
  notice?: string;
};

const demoFoods: DetectedFood[] = [
  {
    name: "Idli",
    estimatedPortion: "2 pieces",
    quantity: 2,
    unit: "pieces",
    confidence: 0.69
  },
  {
    name: "Sambar",
    estimatedPortion: "1 bowl",
    quantity: 1,
    unit: "bowl",
    confidence: 0.73
  },
  {
    name: "Coconut chutney",
    estimatedPortion: "2 tablespoons",
    quantity: 2,
    unit: "tablespoons",
    confidence: 0.58
  }
];

const responseFormat = {
  type: "json_schema",
  json_schema: {
    name: "meal_detection",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["foods"],
      properties: {
        foods: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "estimatedPortion", "confidence"],
            properties: {
              name: { type: "string", minLength: 1 },
              estimatedPortion: { type: "string", minLength: 1 },
              quantity: { type: "number", exclusiveMinimum: 0 },
              unit: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 }
            }
          }
        }
      }
    }
  }
} as const;

const getAssistantJson = (content: string | Array<{ type?: string; text?: string }> | null | undefined) => {
  if (!content) {
    return null;
  }

  if (typeof content === "string") {
    return content.trim();
  }

  const text = content
    .map((item) => (item.type === "text" ? item.text ?? "" : ""))
    .join("")
    .trim();

  return text || null;
};

export const analyzeMealPhoto = async (imageDataUrl: string): Promise<VisionAnalysisResult> => {
  if (!openai) {
    if (env.ALLOW_DEMO_MODE) {
      return {
        foods: demoFoods,
        source: "local-fallback",
        notice: "OpenAI Vision is not configured. Returning a demo draft."
      };
    }

    return analyzeMealPhotoLocally(imageDataUrl, "provider not configured");
  }

  let response;

  try {
    response = await openai.chat.completions.create({
      model: env.OPENAI_VISION_MODEL,
      response_format: responseFormat,
      max_completion_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition vision assistant. Identify only foods and beverages visibly present in the image. Use conservative portion estimates and do not invent unseen side dishes."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Analyze this meal photo.",
                "Return visible foods only.",
                "Estimate portion sizes conservatively.",
                "If the image is unclear, still return the best visible candidates with lower confidence."
              ].join(" ")
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
                detail: "high"
              }
            }
          ]
        }
      ]
    });
  } catch (error) {
    const cause = error instanceof Error ? error : null;
    const message =
      cause && "cause" in cause && cause.cause instanceof Error
        ? cause.cause.message
        : cause?.message ?? "Unknown provider error.";

    if (
      message.includes("issuer certificate") ||
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate limit") ||
      message.toLowerCase().includes("connection error")
    ) {
      return analyzeMealPhotoLocally(imageDataUrl, message);
    }

    throw new ApiError(502, `OpenAI Vision request failed: ${message}`);
  }

  const rawText = getAssistantJson(response.choices[0]?.message?.content);

  if (!rawText) {
    throw new ApiError(502, "OpenAI Vision returned an empty response.");
  }

  let json: unknown;

  try {
    json = JSON.parse(rawText);
  } catch {
    throw new ApiError(502, "OpenAI Vision did not return JSON.");
  }

  const parsed = responseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(502, "OpenAI Vision returned an invalid payload.");
  }

  return {
    foods: parsed.data.foods.map((food) => ({
      ...food,
      name: food.name.trim(),
      estimatedPortion: food.estimatedPortion.trim(),
      unit: food.unit?.trim()
    })),
    source: "openai"
  };
};
