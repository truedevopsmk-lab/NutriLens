import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { app } from "./app";

const server = app.listen(env.API_PORT, () => {
  console.log(`NutriLens API listening on http://localhost:${env.API_PORT}`);
  console.log(
    `[startup] vision=${env.OPENAI_API_KEY ? "configured" : env.ALLOW_DEMO_MODE ? "demo" : "missing"} model=${env.OPENAI_VISION_MODEL}`
  );
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
