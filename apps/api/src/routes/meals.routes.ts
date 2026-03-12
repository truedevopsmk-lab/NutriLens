import { MealType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { buildHealthConnectRecord } from "../services/health-connect.service";
import { enrichFoodsWithNutrition } from "../services/fatsecret.service";
import { analyzeMealPhoto } from "../services/openai-vision.service";
import { getDayRange } from "../utils/date";
import { asyncHandler } from "../utils/async-handler";
import { roundTo, toNumber } from "../utils/numbers";

const router = Router();

const mealTypeSchema = z.nativeEnum(MealType);

const uploadSchema = z.object({
  mealType: mealTypeSchema,
  imageDataUrl: z.string().min(20)
});

const confirmSchema = z.object({
  mealType: mealTypeSchema,
  imageDataUrl: z.string().optional(),
  foods: z
    .array(
      z.object({
        name: z.string().min(1),
        portionDescription: z.string().min(1),
        quantity: z.number().positive().optional(),
        unit: z.string().optional(),
        calories: z.number().min(0),
        protein: z.number().min(0),
        carbs: z.number().min(0),
        fat: z.number().min(0),
        fiber: z.number().min(0),
        confidence: z.number().min(0).max(1).optional(),
        externalFoodId: z.string().optional()
      })
    )
    .min(1)
});

const mapMealResponse = (meal: {
  id: string;
  mealType: MealType;
  createdAt: Date;
  foods: Array<{
    id: string;
    name: string;
    portionDescription: string | null;
    calories: number;
    protein: unknown;
    carbs: unknown;
    fat: unknown;
    fiber: unknown;
  }>;
}) => {
  const totals = meal.foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + toNumber(food.protein),
      carbs: acc.carbs + toNumber(food.carbs),
      fat: acc.fat + toNumber(food.fat),
      fiber: acc.fiber + toNumber(food.fiber)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return {
    id: meal.id,
    mealType: meal.mealType,
    createdAt: meal.createdAt,
    foods: meal.foods.map((food) => ({
      id: food.id,
      name: food.name,
      portionDescription: food.portionDescription ?? "",
      calories: food.calories,
      protein: toNumber(food.protein),
      carbs: toNumber(food.carbs),
      fat: toNumber(food.fat),
      fiber: toNumber(food.fiber)
    })),
    totals: {
      calories: totals.calories,
      protein: roundTo(totals.protein),
      carbs: roundTo(totals.carbs),
      fat: roundTo(totals.fat),
      fiber: roundTo(totals.fiber)
    }
  };
};

router.use(requireAuth);

router.post(
  "/photo-upload",
  asyncHandler(async (req, res) => {
    const payload = uploadSchema.parse(req.body);

    const analysis = await analyzeMealPhoto(payload.imageDataUrl);
    const enrichedFoods = await enrichFoodsWithNutrition(analysis.foods, {
      preferLocal: analysis.source === "local-fallback"
    });

    const totals = enrichedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + toNumber(food.calories),
        protein: roundTo(acc.protein + toNumber(food.protein)),
        carbs: roundTo(acc.carbs + toNumber(food.carbs)),
        fat: roundTo(acc.fat + toNumber(food.fat)),
        fiber: roundTo(acc.fiber + toNumber(food.fiber))
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    res.json({
      mealType: payload.mealType,
      analysisSource: analysis.source,
      analysisNotice: analysis.notice,
      foods: enrichedFoods,
      totals
    });
  })
);

router.post(
  "/confirm",
  asyncHandler(async (req, res) => {
    const payload = confirmSchema.parse(req.body);
    const userId = req.user!.userId;

    const meal = await prisma.meal.create({
      data: {
        userId,
        mealType: payload.mealType,
        photoUrl: payload.imageDataUrl?.startsWith("http")
          ? payload.imageDataUrl
          : undefined,
        sourceImageMimeType:
          payload.imageDataUrl?.match(/^data:(.*?);base64,/)?.[1],
        foods: {
          create: payload.foods.map((food) => ({
            name: food.name,
            portionDescription: food.portionDescription,
            quantity: food.quantity,
            unit: food.unit,
            calories: Math.round(toNumber(food.calories)),
            protein: toNumber(food.protein),
            carbs: toNumber(food.carbs),
            fat: toNumber(food.fat),
            fiber: toNumber(food.fiber),
            confidence: food.confidence ?? null,
            externalFoodId: food.externalFoodId ?? null
          }))
        }
      },
      include: {
        foods: true
      }
    });

    const mealResponse = mapMealResponse(meal);

    const healthConnectRecord = buildHealthConnectRecord({
      mealName: `${payload.mealType.toLowerCase()} meal`,
      consumedAt: meal.createdAt.toISOString(),
      nutrients: mealResponse.totals
    });

    res.status(201).json({
      meal: mealResponse,
      healthConnectRecord
    });
  })
);

router.get(
  "/today",
  asyncHandler(async (req, res) => {
    const { start, end } = getDayRange();

    const meals = await prisma.meal.findMany({
      where: {
        userId: req.user!.userId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        foods: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    res.json({
      meals: meals.map(mapMealResponse)
    });
  })
);

router.get(
  "/history",
  asyncHandler(async (req, res) => {
    const requestedDays = Number(req.query.days ?? 7);
    const days = Number.isFinite(requestedDays)
      ? Math.min(Math.max(requestedDays, 1), 30)
      : 7;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const meals = await prisma.meal.findMany({
      where: {
        userId: req.user!.userId,
        createdAt: {
          gte: since
        }
      },
      include: {
        foods: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      meals: meals.map(mapMealResponse)
    });
  })
);

export default router;
