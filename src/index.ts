import { Status } from 'discord.js';
import { CONFIG } from './config.js';
import { client } from './bot.js';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.get('/api/status', (_req, res) => {
  const shards = client.ws.shards.map(shard => ({
    id: shard.id,
    ready: shard.status === Status.Ready,
    ping: shard.ping,
    guilds: client.guilds.cache.filter(g => g.shardId === shard.id).size,
    uptime: client.uptime ?? 0,
  }));
  res.json({ shards });
});

const server = app.listen(CONFIG.monitorPort, () => {
  console.log(`Monitoring interface on port ${CONFIG.monitorPort}`);
});

// As PID 1 in the container, node ignores SIGTERM unless a handler is registered.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    console.log(`Received ${signal}, shutting down`);
    server.close();
    await client.destroy();
    process.exit(0);
  });
}

await client.login(CONFIG.token);
