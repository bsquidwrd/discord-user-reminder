import 'dotenv/config';

function parseShardCount(raw: string | undefined): 'auto' | number {
  const value = raw?.trim();
  if (!value || value.toLowerCase() === 'auto') return 'auto';
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`SHARD_COUNT must be "auto" or a positive integer, got "${value}"`);
  }
  return count;
}

const shardCount = parseShardCount(process.env.SHARD_COUNT);
// discord.js reads SHARD_COUNT from the environment itself (meant for ShardingManager children)
// and would turn "auto" into NaN.
delete process.env.SHARD_COUNT;

export const CONFIG = {
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  databaseUrl: process.env.DATABASE_URL ?? 'file:./data.db',
  defaultTz: process.env.DEFAULT_TZ ?? 'UTC',
  shardCount,
  schedulerIntervalMs: process.env.SCHEDULER_INTERVAL_MS ? Number(process.env.SCHEDULER_INTERVAL_MS) : 20_000,
  schedulerBatchSize: process.env.SCHEDULER_BATCH_SIZE ? Number(process.env.SCHEDULER_BATCH_SIZE) : 50,
  monitorPort: process.env.MONITOR_PORT ? Number(process.env.MONITOR_PORT) : 3000,
};

if (!CONFIG.token || !CONFIG.clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment');
}
