FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install

COPY apps/web ./apps/web
RUN npm run build --workspace @nutrilens/web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/apps/web ./apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@nutrilens/web"]
