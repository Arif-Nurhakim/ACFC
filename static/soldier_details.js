const sessionCode = sessionStorage.getItem('soldierSessionCode');
const sessionInfo = document.getElementById('sessionInfo');
const submitBtn = document.getElementById('submitBtn');
const resultCard = document.getElementById('resultCard');
const result = document.getElementById('result');
const detailLevelSelect = document.getElementById('detailLevel');
const rankSelect = document.getElementById('rank');

const ranks = ['PTE', 'LCP', 'CPL', '3SG', '2SG', '1SG', 'SSG', 'MSG', '3WO', '2WO', '1WO', 'OCT', 'SCT', '2LT', 'LTA', 'CPT', 'MAJ', 'LTC', 'SLTC', 'COL'];

if (!sessionCode) {
  window.location.href = '/soldier/login';
}

function populateDetailLevels() {
  detailLevelSelect.innerHTML = '<option value="">Select detail level</option>';
  for (let level = 1; level <= 20; level += 1) {
    const opt = document.createElement('option');
    opt.value = String(level);
    opt.textContent = String(level);
    detailLevelSelect.appendChild(opt);
  }
}

function populateRanks() {
  rankSelect.innerHTML = '<option value="">Select rank</option>';
  ranks.forEach((rank) => {
    const opt = document.createElement('option');
    opt.value = rank;
    opt.textContent = rank;
    rankSelect.appendChild(opt);
  });
}

async function loadSession() {
  const res = await fetch('/api/soldier/session/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode }),
  });
  const data = await res.json();

  if (!res.ok) {
    alert(data.detail || 'Session not found.');
    window.location.href = '/soldier/login';
    return;
  }

  sessionInfo.textContent = `Session ${data.session_code} | Unit: ${data.unit} | Coy: ${data.coy} | Test Date: ${data.test_date}`;
  document.getElementById('unit').value = data.unit;
  document.getElementById('coy').value = data.coy;
}

submitBtn.addEventListener('click', async () => {
  const payload = {
    session_code: sessionCode,
    full_nric: document.getElementById('fullNric').value.trim(),
    full_name: document.getElementById('fullName').value.trim(),
    rank: rankSelect.value,
    unit: document.getElementById('unit').value.trim(),
    coy: document.getElementById('coy').value.trim(),
    platoon: document.getElementById('platoon').value.trim(),
    detail_level: Number(detailLevelSelect.value),
  };

  if (!payload.full_nric || !payload.full_name || !payload.rank || !payload.unit || !payload.coy || !payload.platoon || Number.isNaN(payload.detail_level)) {
    alert('Please complete all fields.');
    return;
  }

  const res = await fetch('/api/soldier/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok) {
    alert(data.detail || 'Failed to submit soldier details.');
    return;
  }

  result.textContent = JSON.stringify(data, null, 2);
  resultCard.classList.remove('hidden');
});

populateDetailLevels();
populateRanks();
loadSession();
