# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Run ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable \
  && apk add --no-cache curl   # <-- para el healthCheck de ECS
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 80
CMD ["./entrypoint.sh"]
