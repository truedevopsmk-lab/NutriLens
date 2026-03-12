import "dotenv/config";

import { z } from "zod";

const optionalString = () =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim();
    return normalized === "" ? undefined : normalized;
  }, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  OPENAI_API_KEY: optionalString(),
  OPENAI_VISION_MODEL: z.string().default("gpt-4.1-mini"),
  FATSECRET_CLIENT_ID: optionalString(),
  FATSECRET_CLIENT_SECRET: optionalString(),
  FATSECRET_AUTH_URL: z.string().default("https://oauth.fatsecret.com/connect/token"),
  FATSECRET_BASE_URL: z.string().default("https://platform.fatsecret.com/rest/foods/search/v2"),
  FATSECRET_REGION: z.string().default("IN"),
  GARMIN_SYNC_MODE: z.enum(["mock", "api"]).default("mock"),
  GARMIN_ACCESS_TOKEN_URL: optionalString(),
  GARMIN_BASE_URL: optionalString(),
  GARMIN_DAILY_SUMMARY_PATH: optionalString(),
  GARMIN_ACTIVITY_PATH: optionalString(),
  GARMIN_CLIENT_ID: optionalString(),
  GARMIN_CLIENT_SECRET: optionalString(),
  GARMIN_USER_ID: optionalString(),
  GARMIN_REGION: z.string().default("US"),
  ALLOW_DEMO_MODE: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true")
});

export const env = envSchema.parse(process.env);
