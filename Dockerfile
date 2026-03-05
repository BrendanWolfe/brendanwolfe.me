FROM node:lts-slim AS base
WORKDIR /app

COPY package*.json ./

FROM base AS prod-deps
RUN npm ci --omit=dev

FROM base AS build-deps
RUN npm ci

FROM build-deps AS build
WORKDIR /app

COPY . .
RUN npm run build

FROM base AS runtime
WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
