FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN mkdir -p dist/assets && cp -r src/assets dist/

FROM --platform=linux/amd64 node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache sqlite

RUN mkdir -p /app/data && chown -R node:node /app/data

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

USER node

VOLUME ["/app/data"]

ENV SQLITE_DB_PATH=/app/data/sz-discord-bot.db
ENV NODE_ENV=production

# Run migrations before starting the application
COPY --from=builder /app/src/db/migrations ./src/db/migrations
RUN npm install ts-node typescript
RUN npx ts-node src/db/migrations/migrate-servers.ts

CMD ["node", "dist/index.js"] 