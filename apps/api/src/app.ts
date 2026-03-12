import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";

import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import garminRoutes from "./routes/garmin.routes";
import mealsRoutes from "./routes/meals.routes";
import { ApiError } from "./utils/api-error";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "nutrilens-api",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/garmin", garminRoutes);

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Validation failed.",
      issues: error.flatten()
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  console.error(error);

  return response.status(500).json({
    message: "Unexpected server error."
  });
});
