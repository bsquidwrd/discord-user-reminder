import 'dotenv/config';

export const CONFIG = {
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  databaseUrl: process.env.DATABASE_URL ?? 'file:./data.db',
  defaultTz: process.env.DEFAULT_TZ ?? 'UTC',
  shardCount: process.env.SHARD_COUNT ? Number(process.env.SHARD_COUNT) : 'auto' as 'auto' | number,
  schedulerIntervalMs: process.env.SCHEDULER_INTERVAL_MS ? Number(process.env.SCHEDULER_INTERVAL_MS) : 20_000,
  schedulerBatchSize: process.env.SCHEDULER_BATCH_SIZE ? Number(process.env.SCHEDULER_BATCH_SIZE) : 50,
  monitorPort: process.env.MONITOR_PORT ? Number(process.env.MONITOR_PORT) : 3000,
};

if (!CONFIG.token || !CONFIG.clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment');
}
