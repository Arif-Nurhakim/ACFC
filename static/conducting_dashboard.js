const sessionCode = sessionStorage.getItem('officerSessionCode') || localStorage.getItem('officerSessionCode');
const password = sessionStorage.getItem('officerPassword') || localStorage.getItem('officerPassword');

const topToast = document.getElementById('topToast');
const sessionInfo = document.getElementById('sessionInfo');
const exportBtn = document.getElementById('exportBtn');
const detailsContainer = document.getElementById('detailsContainer');

let refreshTimer;
let toastTimeout;

if (!sessionCode || !password) {
  window.location.href = '/conducting-officer';
}

function showToast(message, isError = false) {
  topToast.textContent = message;
  topToast.classList.remove('hidden', 'error');
  if (isError) {
    topToast.classList.add('error');
  }

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastTimeout = setTimeout(() => {
    topToast.classList.add('hidden');
  }, 2600);
}

function showValue(value) {
  return value ?? '—';
}

function stationCompleted(row, station) {
  if (station === 'WBT') {
    return row.wbt !== null;
  }
  if (station === 'RIR') {
    return row.rir !== null;
  }
  return row.mcs_level !== null && row.mcs_stage !== null;
}

function toPercent(done, total) {
  if (!total) {
    return 0;
  }
  return Math.round((done / total) * 100);
}

function renderProgressBar(label, percent) {
  return `
    <div class="progress-item">
      <span>${label}: ${percent}%</span>
      <div class="progress-track">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>
    </div>
  `;
}

function buildSummary(detailLevel, soldiers) {
  const total = soldiers.length;
  const wbtDone = soldiers.filter((s) => stationCompleted(s, 'WBT')).length;
  const rirDone = soldiers.filter((s) => stationCompleted(s, 'RIR')).length;
  const mcsDone = soldiers.filter((s) => stationCompleted(s, 'MCS')).length;

  const wbtPct = toPercent(wbtDone, total);
  const rirPct = toPercent(rirDone, total);
  const mcsPct = toPercent(mcsDone, total);

  return `
    <div class="detail-summary">
      <strong>Detail Level ${detailLevel} (${total})</strong>
      ${renderProgressBar('WBT', wbtPct)}
      ${renderProgressBar('RIR', rirPct)}
      ${renderProgressBar('MCS', mcsPct)}
    </div>
  `;
}

function buildRowTable(detailLevel, soldiers) {
  const wrapper = document.createElement('details');
  wrapper.className = 'detail-group';
  wrapper.open = true;

  const summary = document.createElement('summary');
  summary.innerHTML = buildSummary(detailLevel, soldiers);
  wrapper.appendChild(summary);

  const table = document.createElement('table');
  table.className = 'commander-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Rank</th>
        <th>Unit</th>
        <th>Coy</th>
        <th>Platoon</th>
        <th>WBT</th>
        <th>RIR</th>
        <th>MCS Level</th>
        <th>MCS Stage</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  soldiers.forEach((s) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Name">${s.full_name}</td>
      <td data-label="Rank">${showValue(s.rank)}</td>
      <td data-label="Unit">${s.unit}</td>
      <td data-label="Coy">${s.coy}</td>
      <td data-label="Platoon">${s.platoon}</td>
      <td data-label="WBT">${showValue(s.wbt)}</td>
      <td data-label="RIR">${showValue(s.rir)}</td>
      <td data-label="MCS Level">${showValue(s.mcs_level)}</td>
      <td data-label="MCS Stage">${showValue(s.mcs_stage)}</td>
    `;
    tbody.appendChild(row);
  });

  wrapper.appendChild(table);
  detailsContainer.appendChild(wrapper);
}

async function loadDashboard() {
  const res = await fetch('/api/officer/session-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    showToast(data.detail || 'Unable to load officer dashboard.', true);
    return;
  }

  sessionInfo.textContent = `Session ${data.session.session_code} | Unit: ${data.session.unit} | Coy: ${data.session.coy} | Test Date: ${data.session.test_date}`;
  detailsContainer.innerHTML = '';

  Object.entries(data.by_detail_level).forEach(([detailLevel, soldiers]) => {
    buildRowTable(detailLevel, soldiers);
  });
}

exportBtn.addEventListener('click', async () => {
  const res = await fetch('/api/officer/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    showToast(data.detail || 'Export failed.', true);
    return;
  }

  showToast('Export action is successful. Download started.');
  window.open(data.share_link, '_blank', 'noopener,noreferrer');
});

loadDashboard();
refreshTimer = setInterval(loadDashboard, 4000);
window.addEventListener('beforeunload', () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
