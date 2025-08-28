function formatDuration(ms) {
  const units = [
    { label: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
    { label: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
    { label: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
    { label: 'day', ms: 1000 * 60 * 60 * 24 },
    { label: 'hour', ms: 1000 * 60 * 60 },
    { label: 'minute', ms: 1000 * 60 },
    { label: 'second', ms: 1000 },
  ];
  const parts = [];
  for (const unit of units) {
    const value = Math.floor(ms / unit.ms);
    if (value > 0) {
      parts.push(`${value} ${unit.label}${value !== 1 ? 's' : ''}`);
      ms -= value * unit.ms;
    }
  }
  return parts.length ? parts.join(', ') : '0 seconds';
}

async function load() {
  const res = await fetch('/api/status');
  const data = await res.json();
  const tbody = document.querySelector('#shard-table tbody');
  tbody.innerHTML = '';
  data.shards.forEach(s => {
    const tr = document.createElement('tr');
    const statusClass = s.ready ? 'status-ready' : 'status-down';
    const statusText = s.ready ? 'Online' : 'Offline';
    tr.innerHTML = `<td>${s.id}</td><td class="${statusClass}">${statusText}</td><td>${s.guilds}</td><td>${s.ping}</td><td>${formatDuration(s.uptime)}</td>`;
    tbody.appendChild(tr);
  });
}

setInterval(load, 2000);
load();
