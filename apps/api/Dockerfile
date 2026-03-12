FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY package-lock.json ./
COPY prisma ./prisma
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/api/package.json ./apps/api/package.json

RUN npm install

COPY apps/api ./apps/api
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate
RUN npm run build --workspace @nutrilens/api

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/apps/api ./apps/api

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node apps/api/dist/server.js"]
