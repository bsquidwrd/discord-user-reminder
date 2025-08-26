# syntax=docker/dockerfile:1
FROM node:24-alpine3.22 AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm i
RUN npm run build

FROM node:24-alpine3.22 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm i --omit=dev
COPY --from=build /app/dist ./dist
COPY .env.sample README.md app-manifest.json ./
# Create the data directory and set up persistent volume for SQLite database
RUN mkdir -p /data
VOLUME ["/data"]
ENV DATABASE_URL="file:/data/reminders.db"
ENV DEFAULT_TZ="UTC"
CMD ["npm","start"]
