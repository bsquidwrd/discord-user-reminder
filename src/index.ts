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
});

await manager.spawn();

const app = express();

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

app.get('/', (_req, res) => {
  res.send(`<!doctype html>
<html><head><title>Shard Status</title></head>
<body><h1>Shard Status</h1>
<table border="1" cellspacing="0" cellpadding="4">
<thead><tr><th>ID</th><th>Ready</th><th>Guilds</th><th>Ping</th><th>Uptime (s)</th></tr></thead>
<tbody id="tbody"></tbody>
</table>
<script>
async function load(){
  const res = await fetch('/api/status');
  const data = await res.json();
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  data.shards.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = \`<td>\${s.id}</td><td>\${s.ready}</td><td>\${s.guilds}</td><td>\${s.ping}</td><td>\${Math.floor(s.uptime/1000)}</td>\`;
    tbody.appendChild(tr);
  });
}
setInterval(load, 2000);
load();
</script>
</body></html>`);
});

app.listen(CONFIG.monitorPort, () => {
  console.log(`Monitoring interface on port ${CONFIG.monitorPort}`);
});
