import { ShardingManager } from 'discord.js';
import { CONFIG } from './config.js';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manager = new ShardingManager(path.join(__dirname, 'bot.js'), {
  token: CONFIG.token,
  totalShards: CONFIG.shardCount,
});

manager.on('shardCreate', shard => {
  console.log(`Launched shard ${shard.id}`);
  shard.on("death", () => {
    console.log(`Shard ${shard.id} died, restarting`);
    shard
      .respawn()
      .catch(err => console.error(`Failed to respawn shard ${shard.id}`, err));
  });
});

await manager.spawn();

const app = express();
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.get('/api/status', async (_req, res) => {
  try {
    const shards = await manager.broadcastEval((client) => ({
      id: client.shard?.ids[0] ?? 0,
      ready: client.isReady(),
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      uptime: client.uptime ?? 0,
    }));
    res.json({ shards });
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch shard status' });
  }
});

app.listen(CONFIG.monitorPort, () => {
  console.log(`Monitoring interface on port ${CONFIG.monitorPort}`);
});
