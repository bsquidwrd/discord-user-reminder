# Discord Reminder User App — Works Everywhere in Discord (Docker)
A TypeScript/Node.js Discord app that works in **any Discord context**: DMs, servers, threads, voice channels, and more. Supports both user-install and guild-install.

## Run with Docker
1) Create `.env` in the project root (same folder as `docker-compose.yml`):
   ```env
   DISCORD_TOKEN=your-bot-token
   DISCORD_CLIENT_ID=your-application-id
   ```
   (Optional) Add:
   ```env
   DEFAULT_TZ=America/Los_Angeles
   SHARD_COUNT=auto
   DATABASE_URL=file:/data/reminders.db
   SCHEDULER_INTERVAL_MS=20000
   SCHEDULER_BATCH_SIZE=50
   MONITOR_PORT=3000
   ```
   Sharding is enabled; set `SHARD_COUNT` if you need a specific number of shards (default `auto`).
   Adjust `SCHEDULER_INTERVAL_MS` and `SCHEDULER_BATCH_SIZE` to tune reminder throughput.
   `MONITOR_PORT` controls the web interface used to monitor shard status.

2) Build the image:
   ```bash
   docker compose build
   ```

3) Register commands globally (User-Install + Guild-Install, all contexts):
   ```bash
   docker compose run --rm reminder npm run register:prod
   ```

4) Start the bot (detached):
   ```bash
   docker compose up -d
   ```

5) Visit `http://localhost:3000` (or your chosen `MONITOR_PORT`) to view shard status.

6) Use the app anywhere in Discord:
   - **In DMs**: `/remind when:"in 1h" note:"ping me"`
   - **In server channels**: `/remind when:"tomorrow 9am" link:"https://discord.com/channels/..."`
   - **In threads**: Right-click a message → Apps → "Remind me"
   - **In voice channels**: `/reminders list`
   - **Manage settings**: `/timezone set tz:"America/Los_Angeles"`

> Data persistence: reminders live in SQLite at `/data/reminders.db`. The compose file mounts `./data:/data` so your data survives restarts.

## Local (non-Docker)
```bash
cp .env.sample .env
npm i
npm run register
npm run dev
```

## Manifest (User-Install + Guild-Install, all contexts)
See `app-manifest.json` and paste it into the Developer Portal → App Manifest.
