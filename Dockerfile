# syntax=docker/dockerfile:1
FROM node:24-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci
RUN npm run build

FROM node:24-alpine3.24 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY .env.sample README.md app-manifest.json ./
# Copy public assets for the monitoring UI
COPY public ./public
# Create the data directory and set up persistent volume for SQLite database
RUN mkdir -p /data
VOLUME ["/data"]
ENV DATABASE_URL="file:/data/reminders.db"
ENV DEFAULT_TZ="UTC"
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.MONITOR_PORT||3000)+'/api/status').then(r=>r.json()).then(d=>process.exit(d.shards?.length&&d.shards.every(s=>s.ready)?0:1)).catch(()=>process.exit(1))"
CMD ["node","dist/index.js"]
