const sessionCode = sessionStorage.getItem('soldierSessionCode');
const sessionInfo = document.getElementById('sessionInfo');
const submitBtn = document.getElementById('submitBtn');
const detailLevelSelect = document.getElementById('detailLevel');
const rankSelect = document.getElementById('rank');
const topToast = document.getElementById('topToast');

let toastTimeout;

const ranks = ['PTE', 'LCP', 'CPL', '3SG', '2SG', '1SG', 'SSG', 'MSG', '3WO', '2WO', '1WO', 'OCT', 'SCT', '2LT', 'LTA', 'CPT', 'MAJ', 'LTC', 'SLTC', 'COL'];

if (!sessionCode) {
  window.location.href = '/soldier/login';
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
    showToast(data.detail || 'Session not found.', true);
    window.location.href = '/soldier/login';
    return;
  }

  sessionInfo.textContent = `Session ${data.session_code} | Unit: ${data.unit} | Coy: ${data.coy} | Test Date: ${data.test_date}`;
  document.getElementById('unit').value = String(data.unit || '').toUpperCase();
  document.getElementById('coy').value = String(data.coy || '').toUpperCase();
}

submitBtn.addEventListener('click', async () => {
  const payload = {
    session_code: sessionCode,
    full_nric: document.getElementById('fullNric').value.trim().toUpperCase(),
    full_name: document.getElementById('fullName').value.trim().toUpperCase(),
    rank: rankSelect.value,
    unit: document.getElementById('unit').value.trim().toUpperCase(),
    coy: document.getElementById('coy').value.trim().toUpperCase(),
    platoon: document.getElementById('platoon').value.trim().toUpperCase(),
    detail_level: Number(detailLevelSelect.value),
  };

  if (!payload.full_nric || !payload.full_name || !payload.rank || !payload.unit || !payload.coy || !payload.platoon || Number.isNaN(payload.detail_level)) {
    showToast('Please complete all fields.', true);
    return;
  }

  const res = await fetch('/api/soldier/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok) {
    showToast(data.detail || 'Failed to submit soldier details.', true);
    return;
  }

  showToast('Details successfully submitted.');
});

populateDetailLevels();
populateRanks();
loadSession();
