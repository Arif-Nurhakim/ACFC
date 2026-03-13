const createBtn = document.getElementById('createBtn');
const goDashboardBtn = document.getElementById('goDashboardBtn');
const useRecentBtn = document.getElementById('useRecentBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const clearDetailSheetBtn = document.getElementById('clearDetailSheetBtn');
const importResult = document.getElementById('importResult');

function setImportResult(message, isError = false) {
  importResult.textContent = message;
  importResult.classList.remove('hidden');
  importResult.style.borderColor = isError ? '#ef4444' : '';
}

function syncSessionFields(sessionCode, password) {
  document.getElementById('dashboardSessionCode').value = sessionCode;
  document.getElementById('dashboardPassword').value = password;
}

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

async function uploadDetailSheet(sessionCode, password, file) {
  const formData = new FormData();
  formData.append('session_code', sessionCode);
  formData.append('password', password);
  formData.append('file', file);

  const res = await fetch('/api/officer/import-details', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || 'Import failed.');
  }

  return data;
}

createBtn.addEventListener('click', async () => {
  const payload = {
    unit: document.getElementById('unit').value.trim().toUpperCase(),
    coy: document.getElementById('coy').value.trim().toUpperCase(),
    test_date: document.getElementById('testDate').value,
    session_code: document.getElementById('sessionCode').value.trim().toUpperCase(),
    password: document.getElementById('password').value,
  };

  const fileInput = document.getElementById('detailSheetFile');
  const file = fileInput.files && fileInput.files[0];

  if (!payload.unit || !payload.coy || !payload.test_date || !payload.session_code || !payload.password || !file) {
    setImportResult('Please complete all fields and select a detail sheet (.xlsx).', true);
    return;
  }

  const res = await fetch('/api/conducting/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok && res.status !== 409) {
    setImportResult(data.detail || 'Failed to create session.', true);
    return;
  }

  try {
    const importResultData = await uploadDetailSheet(payload.session_code, payload.password, file);
    saveOfficerSession(payload.session_code, payload.password);
    syncSessionFields(payload.session_code, payload.password);
    fileInput.value = '';
    setImportResult(`Imported ${importResultData.imported_count} rows successfully.`, false);
    window.location.href = '/conducting-officer/dashboard';
  } catch (error) {
    setImportResult(error.message || 'Import failed.', true);
  }
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

  syncSessionFields(recentSessionCode.toUpperCase(), recentPassword);
  setImportResult('Recent session loaded. You can upload a corrected file or open dashboard.', false);
});

downloadTemplateBtn.addEventListener('click', () => {
  window.open('/api/officer/import-template', '_blank', 'noopener,noreferrer');
});

clearDetailSheetBtn.addEventListener('click', async () => {
  const sessionCode = document.getElementById('sessionCode').value.trim().toUpperCase();
  const password = document.getElementById('password').value;

  if (!sessionCode || !password) {
    setImportResult('Please enter Session Code and Password in the create section before clearing.', true);
    return;
  }

  const confirmed = window.confirm('Clear imported details and related station scores for this session?');
  if (!confirmed) {
    return;
  }

  const res = await fetch('/api/officer/import-details/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    setImportResult(data.detail || 'Failed to clear imported details.', true);
    return;
  }

  saveOfficerSession(sessionCode, password);
  syncSessionFields(sessionCode, password);
  setImportResult(`Cleared ${data.deleted_profiles} detail rows and ${data.deleted_scores} score rows.`, false);
});
