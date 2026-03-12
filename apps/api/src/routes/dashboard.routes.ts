import { Router } from "express";

import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { getDayRange } from "../utils/date";
import { asyncHandler } from "../utils/async-handler";
import { roundTo, toNumber } from "../utils/numbers";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const { start, end } = getDayRange();
    const userId = request.user!.userId;

    const [meals, activities] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId,
          createdAt: { gte: start, lte: end }
        },
        include: {
          foods: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.activity.findMany({
        where: {
          userId,
          date: { gte: start, lte: end }
        }
      })
    ]);

    const nutrition = meals.flatMap((meal) => meal.foods).reduce(
      (accumulator, food) => ({
        calories: accumulator.calories + food.calories,
        protein: accumulator.protein + toNumber(food.protein),
        carbs: accumulator.carbs + toNumber(food.carbs),
        fat: accumulator.fat + toNumber(food.fat),
        fiber: accumulator.fiber + toNumber(food.fiber)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    const activity = activities.reduce(
      (accumulator, current) => ({
        caloriesBurned: accumulator.caloriesBurned + current.caloriesBurned,
        steps: accumulator.steps + current.steps,
        heartRateAvg:
          accumulator.heartRateAvg && current.heartRateAvg
            ? Math.round((accumulator.heartRateAvg + current.heartRateAvg) / 2)
            : accumulator.heartRateAvg ?? current.heartRateAvg ?? null,
        activityCount: accumulator.activityCount + current.activityCount
      }),
      { caloriesBurned: 0, steps: 0, heartRateAvg: null as number | null, activityCount: 0 }
    );

    response.json({
      caloriesIn: nutrition.calories,
      caloriesOut: activity.caloriesBurned,
      netCalories: nutrition.calories - activity.caloriesBurned,
      macros: {
        protein: roundTo(nutrition.protein),
        carbs: roundTo(nutrition.carbs),
        fat: roundTo(nutrition.fat),
        fiber: roundTo(nutrition.fiber)
      },
      activity: activities.length
        ? {
            caloriesBurned: activity.caloriesBurned,
            steps: activity.steps,
            heartRateAvg: activity.heartRateAvg,
            activityCount: activity.activityCount
          }
        : null,
      meals: meals.map((meal) => ({
        id: meal.id,
        mealType: meal.mealType,
        createdAt: meal.createdAt,
        calories: meal.foods.reduce((sum, food) => sum + food.calories, 0),
        foods: meal.foods.map((food) => food.name)
      }))
    });
  })
);

export default router;
