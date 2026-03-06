const createBtn = document.getElementById('createBtn');
const goDashboardBtn = document.getElementById('goDashboardBtn');
const useRecentBtn = document.getElementById('useRecentBtn');

function saveOfficerSession(sessionCode, password) {
  sessionStorage.setItem('officerSessionCode', sessionCode);
  sessionStorage.setItem('officerPassword', password);
  localStorage.setItem('officerSessionCode', sessionCode);
  localStorage.setItem('officerPassword', password);
}

async function validateOfficerSession(sessionCode, password) {
  const res = await fetch('/api/officer/session-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password }),
  });
  return res;
}

createBtn.addEventListener('click', async () => {
  const payload = {
    unit: document.getElementById('unit').value.trim().toUpperCase(),
    coy: document.getElementById('coy').value.trim().toUpperCase(),
    test_date: document.getElementById('testDate').value,
    session_code: document.getElementById('sessionCode').value.trim().toUpperCase(),
    password: document.getElementById('password').value,
  };

  if (!payload.unit || !payload.coy || !payload.test_date || !payload.session_code || !payload.password) {
    alert('Please complete all fields.');
    return;
  }

  const res = await fetch('/api/conducting/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.detail || 'Failed to create session.');
    return;
  }

  saveOfficerSession(payload.session_code, payload.password);
  window.location.href = '/conducting-officer/dashboard';
});

goDashboardBtn.addEventListener('click', async () => {
  const sessionCode = document.getElementById('dashboardSessionCode').value.trim().toUpperCase();
  const password = document.getElementById('dashboardPassword').value;

  if (!sessionCode || !password) {
    alert('Please enter Session Code and Password.');
    return;
  }

  const res = await validateOfficerSession(sessionCode, password);
  const data = await res.json();
  if (!res.ok) {
    alert(data.detail || 'Unable to open dashboard.');
    return;
  }

  saveOfficerSession(sessionCode, password);
  window.location.href = '/conducting-officer/dashboard';
});

useRecentBtn.addEventListener('click', () => {
  const recentSessionCode = localStorage.getItem('officerSessionCode') || '';
  const recentPassword = localStorage.getItem('officerPassword') || '';

  if (!recentSessionCode || !recentPassword) {
    alert('No recent session found on this device.');
    return;
  }

  document.getElementById('dashboardSessionCode').value = recentSessionCode.toUpperCase();
  document.getElementById('dashboardPassword').value = recentPassword;
});
