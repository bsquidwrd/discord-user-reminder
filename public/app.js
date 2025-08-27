async function load() {
  const res = await fetch('/api/status');
  const data = await res.json();
  const tbody = document.querySelector('#shard-table tbody');
  tbody.innerHTML = '';
  data.shards.forEach(s => {
    const tr = document.createElement('tr');
    const statusClass = s.ready ? 'status-ready' : 'status-down';
    const statusText = s.ready ? 'Online' : 'Offline';
    tr.innerHTML = `<td>${s.id}</td><td class="${statusClass}">${statusText}</td><td>${s.guilds}</td><td>${s.ping}</td><td>${Math.floor(s.uptime / 1000)}</td>`;
    tbody.appendChild(tr);
  });
}

setInterval(load, 2000);
load();
