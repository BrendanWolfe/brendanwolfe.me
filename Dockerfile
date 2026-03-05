FROM node:lts AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:lts AS runtime
WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=build /app/dist ./dist

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
