# NutriLens

NutriLens is a production-oriented calorie intelligence PWA that tracks calories consumed from meal photos and compares them against calories burned from wearable data.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Express API + TypeScript
- PostgreSQL + Prisma ORM
- JWT email authentication
- OpenAI Vision for meal detection
- FatSecret for nutrition enrichment
- Garmin Health sync adapter
- Health Connect bridge payload for Android nutrition writes

## Project layout

```text
nutrilens/
  apps/
    api/        Express + Prisma backend
    web/        Next.js PWA frontend
  prisma/       Prisma schema
  docker-compose.yml
  .env.example
```

## Local setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Run migrations with `npm run prisma:migrate`.
6. Start both services with `npm run dev`.

## API routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/meals/photo-upload`
- `POST /api/meals/confirm`
- `GET /api/meals/today`
- `GET /api/meals/history?days=7`
- `GET /api/dashboard`
- `GET /api/garmin/sync`

## Integration notes

- OpenAI Vision expects a base64 data URL from the captured meal image.
- FatSecret uses OAuth2 client credentials and enriches detected foods with calories and macros.
- Garmin sync runs in either `mock` mode for local development or `api` mode for a production Garmin tenant.
- Health Connect cannot be written directly from a browser-only PWA. The backend returns a structured `NutritionRecord` payload, and the frontend includes a bridge service that can write to Android Health Connect when embedded in a native shell or WebView bridge.

## Deployment

- `apps/api/Dockerfile` builds the API container.
- `apps/web/Dockerfile` builds the Next.js PWA container.
- `docker-compose.yml` runs PostgreSQL, API, and web containers together for development or staging.
