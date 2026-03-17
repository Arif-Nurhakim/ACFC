const sessionCode = sessionStorage.getItem('commanderSessionCode');
const password = sessionStorage.getItem('commanderPassword');
const testDate = sessionStorage.getItem('commanderTestDate');
const assignedStation = sessionStorage.getItem('commanderStation');

const detailsContainer = document.getElementById('detailsContainer');
const sessionInfo = document.getElementById('sessionInfo');
const stationMode = document.getElementById('stationMode');
const saveWbtBtn = document.getElementById('saveWbtBtn');
const saveRirBtn = document.getElementById('saveRirBtn');
const saveMcsBtn = document.getElementById('saveMcsBtn');
const topToast = document.getElementById('topToast');
const detailStateKey = `commanderDetailOpenState:${sessionCode}:${testDate}`;
const draftStateKey = `commanderOfflineDraft:${sessionCode}:${testDate}:${assignedStation}`;
const saveQueueKey = `commanderSaveQueue:${sessionCode}:${testDate}:${assignedStation}`;

let toastTimeout;
let draftScores = {};

if (!sessionCode || !password || !testDate || !assignedStation) {
  window.location.href = '/commander/login';
}

saveWbtBtn.classList.toggle('hidden', assignedStation !== 'WBT');
saveRirBtn.classList.toggle('hidden', assignedStation !== 'RIR');
saveMcsBtn.classList.toggle('hidden', assignedStation !== 'MCS');

function showValue(value) {
  return value ?? '—';
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

function getDetailOpenState() {
  try {
    return JSON.parse(sessionStorage.getItem(detailStateKey) || '{}');
  } catch {
    return {};
  }
}

function setDetailOpenState(detailLevel, isOpen) {
  const state = getDetailOpenState();
  state[String(detailLevel)] = isOpen;
  sessionStorage.setItem(detailStateKey, JSON.stringify(state));
}

function parseStoredJson(key, fallback) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || JSON.stringify(fallback));
    if (Array.isArray(fallback)) {
      return Array.isArray(value) ? value : fallback;
    }
    return value && typeof value === 'object' ? value : fallback;
  } catch {
    return fallback;
  }
}

function getDraftScores() {
  return parseStoredJson(draftStateKey, {});
}

function saveDraftScores(state) {
  sessionStorage.setItem(draftStateKey, JSON.stringify(state));
}

function updateDraftScore(soldierId, patch) {
  const state = getDraftScores();
  const existing = state[soldierId] || {};
  state[soldierId] = { ...existing, ...patch };
  saveDraftScores(state);
  draftScores = state;
}

function clearDraftScoresForSavedRows(scores) {
  if (!scores.length) {
    return;
  }
  const state = getDraftScores();
  scores.forEach((score) => {
    delete state[score.soldier_id];
  });
  saveDraftScores(state);
  draftScores = state;
}

function getSaveQueue() {
  return parseStoredJson(saveQueueKey, []);
}

function setSaveQueue(queue) {
  sessionStorage.setItem(saveQueueKey, JSON.stringify(queue));
}

function enqueueScoresForSync(scores) {
  const queue = getSaveQueue();
  queue.push({
    station: assignedStation,
    queued_at: new Date().toISOString(),
    scores,
  });
  setSaveQueue(queue);
}

async function parseApiResponse(res) {
  const text = await res.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

async function syncQueuedSaves() {
  if (!navigator.onLine) {
    return;
  }

  let remaining = getSaveQueue();
  if (!remaining.length) {
    return;
  }

  let syncedAny = false;

  while (remaining.length) {
    const item = remaining[0];
    try {
      const res = await fetch('/api/commander/scores/station', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_code: sessionCode,
          password,
          test_date: testDate,
          station: item.station,
          scores: item.scores,
        }),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        if (res.status < 500) {
          showToast(data.detail || 'Queued scores need manual review before sync.', true);
        }
        break;
      }

      clearDraftScoresForSavedRows(item.scores);
      remaining = remaining.slice(1);
      syncedAny = true;
    } catch {
      break;
    }
  }

  setSaveQueue(remaining);

  if (syncedAny) {
    showToast('Queued offline scores synced.');
    await loadDashboard();
  }
}

const mcsStageRangeByLevel = {
  1: [0, 0],
  2: [0, 0],
  3: [0, 0],
  4: [1, 1],
  5: [1, 2],
  6: [1, 2],
  7: [1, 4],
  8: [1, 6],
  9: [1, 8],
  10: [1, 8],
  11: [1, 10],
  12: [1, 12],
  13: [1, 14],
  14: [1, 12],
  15: [1, 9],
  16: [1, 2],
};

function buildSelectHtml(className, min, max, currentValue) {
  const selected = currentValue == null ? '' : String(currentValue).toUpperCase();
  const options = ['<option value="">Select</option>'];
  for (let value = min; value <= max; value += 1) {
    const str = String(value);
    const isSelected = selected === str ? ' selected' : '';
    options.push(`<option value="${str}"${isSelected}>${str}</option>`);
  }
  const dnfSelected = selected === 'DNF' ? ' selected' : '';
  options.push(`<option value="DNF"${dnfSelected}>DNF</option>`);
  return `<select class="${className}">${options.join('')}</select>`;
}

function getMcsStageOptions(levelValue) {
  const normalized = String(levelValue || '').toUpperCase();
  if (!normalized) {
    return [];
  }
  if (normalized === 'DNF') {
    return ['DNF'];
  }
  const level = Number(normalized);
  const range = mcsStageRangeByLevel[level];
  if (!range) {
    return [];
  }
  const [min, max] = range;
  const values = [];
  for (let stage = min; stage <= max; stage += 1) {
    values.push(String(stage));
  }
  values.push('DNF');
  return values;
}

function setStageSelectOptions(stageSelect, levelValue, selectedStage) {
  const options = getMcsStageOptions(levelValue);
  const selected = String(selectedStage ?? '').toUpperCase();

  stageSelect.innerHTML = '<option value="">Select</option>';
  options.forEach((value) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    if (selected === value.toUpperCase()) {
      opt.selected = true;
    }
    stageSelect.appendChild(opt);
  });

  if (String(levelValue || '').toUpperCase() === 'DNF') {
    stageSelect.value = 'DNF';
  }
}

function wireMcsDependency(row, soldier) {
  const levelSelect = row.querySelector('.mcs-level-input');
  const stageSelect = row.querySelector('.mcs-stage-input');
  if (!levelSelect || !stageSelect) {
    return;
  }

  const draftStage = draftScores[soldier.soldier_id]?.mcs_stage;
  setStageSelectOptions(stageSelect, levelSelect.value, draftStage ?? soldier.mcs_stage);

  levelSelect.addEventListener('change', () => {
    const previousStage = stageSelect.value;
    setStageSelectOptions(stageSelect, levelSelect.value, previousStage);
  });
}

function renderWbtCell(soldier) {
  if (assignedStation === 'WBT') {
    const draftValue = draftScores[soldier.soldier_id]?.wbt;
    return buildSelectHtml('wbt-input', 0, 100, draftValue ?? soldier.wbt);
  }
  return `<span>${showValue(soldier.wbt)}</span>`;
}

function renderRirCell(soldier) {
  if (assignedStation === 'RIR') {
    const draftValue = draftScores[soldier.soldier_id]?.rir;
    return buildSelectHtml('rir-input', 0, 100, draftValue ?? soldier.rir);
  }
  return `<span>${showValue(soldier.rir)}</span>`;
}

function renderMcsStageCell(soldier) {
  if (assignedStation === 'MCS') {
    return '<select class="mcs-stage-input"><option value="">Select</option></select>';
  }
  return `<span>${showValue(soldier.mcs_stage)}</span>`;
}

function renderMcsLevelCell(soldier) {
  if (assignedStation === 'MCS') {
    const draftValue = draftScores[soldier.soldier_id]?.mcs_level;
    return buildSelectHtml('mcs-level-input', 1, 16, draftValue ?? soldier.mcs_level);
  }
  return `<span>${showValue(soldier.mcs_level)}</span>`;
}

function wireDraftTracking(row, soldierId) {
  if (assignedStation === 'WBT') {
    const wbtInput = row.querySelector('.wbt-input');
    if (wbtInput) {
      wbtInput.addEventListener('change', () => {
        if (!wbtInput.value) {
          return;
        }
        updateDraftScore(soldierId, { wbt: wbtInput.value });
      });
    }
  }

  if (assignedStation === 'RIR') {
    const rirInput = row.querySelector('.rir-input');
    if (rirInput) {
      rirInput.addEventListener('change', () => {
        if (!rirInput.value) {
          return;
        }
        updateDraftScore(soldierId, { rir: rirInput.value });
      });
    }
  }

  if (assignedStation === 'MCS') {
    const mcsStageInput = row.querySelector('.mcs-stage-input');
    const mcsLevelInput = row.querySelector('.mcs-level-input');

    if (mcsLevelInput) {
      mcsLevelInput.addEventListener('change', () => {
        if (!mcsLevelInput.value) {
          return;
        }
        updateDraftScore(soldierId, { mcs_level: mcsLevelInput.value });
      });
    }

    if (mcsStageInput) {
      mcsStageInput.addEventListener('change', () => {
        if (!mcsStageInput.value) {
          return;
        }
        updateDraftScore(soldierId, { mcs_stage: mcsStageInput.value });
      });
    }
  }
}

function buildRowTable(detailLevel, soldiers) {
  const wrapper = document.createElement('details');
  wrapper.className = 'detail-group';
  const openState = getDetailOpenState();
  const detailKey = String(detailLevel);
  wrapper.open = openState[detailKey] === true;

  const summary = document.createElement('summary');
  summary.textContent = `Detail Level ${detailLevel} (${soldiers.length})`;
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
  soldiers.forEach((soldier) => {
    const row = document.createElement('tr');
    row.dataset.soldierId = soldier.soldier_id;
    row.innerHTML = `
      <td data-label="Name">${soldier.full_name}</td>
      <td data-label="Rank">${showValue(soldier.rank)}</td>
      <td data-label="Unit">${soldier.unit}</td>
      <td data-label="Coy">${soldier.coy}</td>
      <td data-label="Platoon">${soldier.platoon}</td>
      <td data-label="WBT">${renderWbtCell(soldier)}</td>
      <td data-label="RIR">${renderRirCell(soldier)}</td>
      <td data-label="MCS Level">${renderMcsLevelCell(soldier)}</td>
      <td data-label="MCS Stage">${renderMcsStageCell(soldier)}</td>
    `;
    tbody.appendChild(row);
    if (assignedStation === 'MCS') {
      wireMcsDependency(row, soldier);
    }
    wireDraftTracking(row, soldier.soldier_id);
  });

  wrapper.appendChild(table);
  wrapper.addEventListener('toggle', () => {
    setDetailOpenState(detailLevel, wrapper.open);
  });
  detailsContainer.appendChild(wrapper);
}

async function loadDashboard() {
  draftScores = getDraftScores();

  const res = await fetch('/api/commander/session-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password, test_date: testDate }),
  });

  const data = await parseApiResponse(res);
  if (!res.ok) {
    alert(data.detail || 'Unable to load dashboard.');
    window.location.href = '/commander/login';
    return;
  }

  sessionInfo.textContent = `Session ${data.session.session_code} | Unit: ${data.session.unit} | Coy: ${data.session.coy} | Test Date: ${data.session.test_date}`;
  stationMode.textContent = `Assigned Station: ${assignedStation} (only this station is editable)`;
  detailsContainer.innerHTML = '';

  Object.entries(data.by_detail_level).forEach(([detailLevel, soldiers]) => {
    buildRowTable(detailLevel, soldiers);
  });
}

async function saveStationScores(station) {
  if (station !== assignedStation) {
    alert(`You are assigned to ${assignedStation} station.`);
    return;
  }

  const rows = detailsContainer.querySelectorAll('tbody tr');
  const scores = [];

  for (const row of rows) {
    if (station === 'WBT') {
      const wbtInput = row.querySelector('.wbt-input');
      const wbt = wbtInput ? wbtInput.value : '';
      if (!wbt) {
        continue;
      }
      scores.push({ soldier_id: row.dataset.soldierId, wbt });
    }
    if (station === 'RIR') {
      const rirInput = row.querySelector('.rir-input');
      const rir = rirInput ? rirInput.value : '';
      if (!rir) {
        continue;
      }
      scores.push({ soldier_id: row.dataset.soldierId, rir });
    }
    if (station === 'MCS') {
      const mcsStageInput = row.querySelector('.mcs-stage-input');
      const mcsLevelInput = row.querySelector('.mcs-level-input');
      const mcsStage = mcsStageInput ? mcsStageInput.value : '';
      const mcsLevel = mcsLevelInput ? mcsLevelInput.value : '';
      if (!mcsStage || !mcsLevel) {
        continue;
      }
      scores.push({ soldier_id: row.dataset.soldierId, mcs_stage: mcsStage, mcs_level: mcsLevel });
    }
  }

  if (!scores.length) {
    alert(`No valid ${station} rows to save.`);
    return;
  }

  const res = await fetch('/api/commander/scores/station', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password, test_date: testDate, station, scores }),
  });

  const data = await parseApiResponse(res);
  if (!res.ok) {
    if (!navigator.onLine || res.status >= 500) {
      enqueueScoresForSync(scores);
      showToast(`Offline-safe: ${station} scores queued for auto-sync.`, true);
      return;
    }
    showToast(data.detail || `Failed to save ${station}.`, true);
    return;
  }

  clearDraftScoresForSavedRows(scores);
  showToast('Scores recorded successfully.');
  await loadDashboard();
}

saveWbtBtn.addEventListener('click', () => saveStationScores('WBT'));
saveRirBtn.addEventListener('click', () => saveStationScores('RIR'));
saveMcsBtn.addEventListener('click', () => saveStationScores('MCS'));

window.addEventListener('online', () => {
  showToast('Back online. Syncing queued scores...');
  syncQueuedSaves();
});

loadDashboard();
syncQueuedSaves();
