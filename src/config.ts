import 'dotenv/config';

export const CONFIG = {
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  databaseUrl: process.env.DATABASE_URL ?? 'file:./data.db',
  defaultTz: process.env.DEFAULT_TZ ?? 'UTC',
};

if (!CONFIG.token || !CONFIG.clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment');
}
