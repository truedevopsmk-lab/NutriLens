import axios from "axios";
import dayjs from "dayjs";

import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

export type GarminDailyMetrics = {
  date: Date;
  caloriesBurned: number;
  steps: number;
  heartRateAvg: number | null;
  activityCount: number;
  rawPayload: unknown;
};

type GarminToken = {
  accessToken: string;
  expiresAt: number;
} | null;

let garminToken: GarminToken = null;

const getGarminToken = async () => {
  if (env.GARMIN_SYNC_MODE !== "api") {
    return null;
  }

  if (garminToken && garminToken.expiresAt > Date.now() + 60_000) {
    return garminToken.accessToken;
  }

  if (
    !env.GARMIN_ACCESS_TOKEN_URL ||
    !env.GARMIN_CLIENT_ID ||
    !env.GARMIN_CLIENT_SECRET
  ) {
    throw new ApiError(500, "Garmin API mode is enabled but credentials are incomplete.");
  }

  const response = await axios.post(
    env.GARMIN_ACCESS_TOKEN_URL,
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      auth: {
        username: env.GARMIN_CLIENT_ID,
        password: env.GARMIN_CLIENT_SECRET
      }
    }
  );

  garminToken = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000
  };

  return garminToken.accessToken;
};

const buildMockMetrics = (date = new Date()): GarminDailyMetrics => ({
  date,
  caloriesBurned: 2240,
  steps: 11842,
  heartRateAvg: 74,
  activityCount: 2,
  rawPayload: {
    source: "mock",
    generatedAt: new Date().toISOString()
  }
});

export const fetchGarminDailyMetrics = async (date = new Date()) => {
  if (env.GARMIN_SYNC_MODE === "mock") {
    return buildMockMetrics(date);
  }

  const accessToken = await getGarminToken();

  if (!accessToken || !env.GARMIN_BASE_URL || !env.GARMIN_DAILY_SUMMARY_PATH) {
    throw new ApiError(500, "Garmin API configuration is incomplete.");
  }

  const userId = env.GARMIN_USER_ID;

  if (!userId) {
    throw new ApiError(500, "GARMIN_USER_ID is required for Garmin sync.");
  }

  const targetDate = dayjs(date).format("YYYY-MM-DD");
  const summaryUrl = new URL(env.GARMIN_DAILY_SUMMARY_PATH, env.GARMIN_BASE_URL).toString();

  const response = await axios.get(summaryUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params: {
      userId,
      date: targetDate
    }
  });

  const summary = response.data;

  return {
    date: dayjs(targetDate).toDate(),
    caloriesBurned: Number(summary?.calories ?? summary?.activeKilocalories ?? 0),
    steps: Number(summary?.steps ?? 0),
    heartRateAvg: summary?.averageHeartRate ? Number(summary.averageHeartRate) : null,
    activityCount: Number(summary?.activityCount ?? summary?.activities?.length ?? 0),
    rawPayload: summary
  };
};
