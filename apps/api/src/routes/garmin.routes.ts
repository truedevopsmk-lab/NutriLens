import { ActivitySource } from "@prisma/client";
import dayjs from "dayjs";
import { Router } from "express";

import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { fetchGarminDailyMetrics } from "../services/garmin.service";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.get(
  "/sync",
  asyncHandler(async (request, response) => {
    const metrics = await fetchGarminDailyMetrics();
    const normalizedDate = dayjs(metrics.date).startOf("day").toDate();

    const activity = await prisma.activity.upsert({
      where: {
        userId_date_source: {
          userId: request.user!.userId,
          date: normalizedDate,
          source: ActivitySource.GARMIN
        }
      },
      update: {
        caloriesBurned: metrics.caloriesBurned,
        steps: metrics.steps,
        heartRateAvg: metrics.heartRateAvg,
        activityCount: metrics.activityCount,
        rawPayload: metrics.rawPayload
      },
      create: {
        userId: request.user!.userId,
        date: normalizedDate,
        caloriesBurned: metrics.caloriesBurned,
        steps: metrics.steps,
        heartRateAvg: metrics.heartRateAvg,
        activityCount: metrics.activityCount,
        source: ActivitySource.GARMIN,
        rawPayload: metrics.rawPayload
      }
    });

    response.json({
      syncedAt: new Date().toISOString(),
      activity: {
        id: activity.id,
        date: activity.date,
        caloriesBurned: activity.caloriesBurned,
        steps: activity.steps,
        heartRateAvg: activity.heartRateAvg,
        activityCount: activity.activityCount
      }
    });
  })
);

export default router;
