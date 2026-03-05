const state = {
  soldiers: [],
};

const el = {
  unit: document.getElementById('unit'),
  coy: document.getElementById('coy'),
  platoon: document.getElementById('platoon'),
  sessionCode: document.getElementById('sessionCode'),
  testDate: document.getElementById('testDate'),
  submittedBy: document.getElementById('submittedBy'),
  notificationEmail: document.getElementById('notificationEmail'),
  name: document.getElementById('name'),
  detailNumber: document.getElementById('detailNumber'),
  wbt: document.getElementById('wbt'),
  rir: document.getElementById('rir'),
  mcsLevel: document.getElementById('mcsLevel'),
  mcsShuttle: document.getElementById('mcsShuttle'),
  addSoldierBtn: document.getElementById('addSoldierBtn'),
  soldierRows: document.getElementById('soldierRows'),
  entryCount: document.getElementById('entryCount'),
  reviewBtn: document.getElementById('reviewBtn'),
  reviewSection: document.getElementById('reviewSection'),
  reviewText: document.getElementById('reviewText'),
  submitBtn: document.getElementById('submitBtn'),
  resultSection: document.getElementById('resultSection'),
  resultText: document.getElementById('resultText'),
};

function setOptions(select, values) {
  select.innerHTML = '';
  values.forEach((value) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
}

async function loadOptions() {
  const res = await fetch('/api/meta/options');
  const data = await res.json();
  setOptions(el.unit, data.units || []);
  setOptions(el.coy, data.coys || []);
  setOptions(el.platoon, data.platoons || []);
}

function clearSoldierInputs() {
  el.name.value = '';
  el.detailNumber.value = '';
  el.wbt.value = '';
  el.rir.value = '';
  el.mcsLevel.value = '';
  el.mcsShuttle.value = '';
}

function renderSoldiers() {
  el.soldierRows.innerHTML = '';
  state.soldiers.forEach((s, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.detail_number}</td>
      <td>${s.wbt}</td>
      <td>${s.rir}</td>
      <td>${s.mcs_level}</td>
      <td>${s.mcs_shuttle}</td>
      <td><button data-index="${index}">Remove</button></td>
    `;
    tr.querySelector('button').addEventListener('click', (event) => {
      const i = Number(event.target.dataset.index);
      state.soldiers.splice(i, 1);
      renderSoldiers();
    });
    el.soldierRows.appendChild(tr);
  });
  el.entryCount.textContent = `${state.soldiers.length} soldiers added`;
}

function addSoldier() {
  const soldier = {
    name: el.name.value.trim(),
    detail_number: el.detailNumber.value.trim(),
    wbt: Number(el.wbt.value),
    rir: Number(el.rir.value),
    mcs_level: Number(el.mcsLevel.value),
    mcs_shuttle: Number(el.mcsShuttle.value),
  };

  const hasInvalid = !soldier.name || !soldier.detail_number || Number.isNaN(soldier.wbt)
    || Number.isNaN(soldier.rir) || Number.isNaN(soldier.mcs_level) || Number.isNaN(soldier.mcs_shuttle);

  if (hasInvalid) {
    alert('Please fill all soldier fields with valid values.');
    return;
  }

  state.soldiers.push(soldier);
  renderSoldiers();
  clearSoldierInputs();
}

function buildPayload() {
  return {
    unit: el.unit.value,
    coy: el.coy.value,
    platoon: el.platoon.value,
    session_code: el.sessionCode.value.trim(),
    test_date: el.testDate.value,
    submitted_by: el.submittedBy.value.trim(),
    notification_email: el.notificationEmail.value.trim() || null,
    soldiers: state.soldiers,
  };
}

function reviewSubmission() {
  const payload = buildPayload();
  if (!payload.session_code || !payload.test_date || !payload.submitted_by) {
    alert('Please complete Session Code, Test Date, and Submitted By before review.');
    return;
  }
  if (!payload.soldiers.length) {
    alert('Please add at least one soldier.');
    return;
  }

  el.reviewText.textContent = JSON.stringify(payload, null, 2);
  el.reviewSection.classList.remove('hidden');
}

async function submitDataset() {
  const payload = buildPayload();
  const res = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.detail || 'Submission failed.');
    return;
  }

  el.resultText.textContent = JSON.stringify(data, null, 2);
  el.resultSection.classList.remove('hidden');
}

el.addSoldierBtn.addEventListener('click', addSoldier);
el.reviewBtn.addEventListener('click', reviewSubmission);
el.submitBtn.addEventListener('click', submitDataset);

loadOptions();
