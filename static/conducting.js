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

function syncSessionFields(sessionCode, password, testDate) {
  document.getElementById('dashboardSessionCode').value = sessionCode;
  document.getElementById('dashboardPassword').value = password;
  document.getElementById('dashboardTestDate').value = testDate;
}

function saveOfficerSession(sessionCode, password, testDate) {
  sessionStorage.setItem('officerSessionCode', sessionCode);
  sessionStorage.setItem('officerPassword', password);
  sessionStorage.setItem('officerTestDate', testDate);
  localStorage.setItem('officerSessionCode', sessionCode);
  localStorage.setItem('officerPassword', password);
  localStorage.setItem('officerTestDate', testDate);
}

async function validateOfficerSession(sessionCode, password, testDate) {
  const res = await fetch('/api/officer/session-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password, test_date: testDate }),
  });
  return res;
}

async function uploadDetailSheet(sessionCode, password, testDate, file) {
  const formData = new FormData();
  formData.append('session_code', sessionCode);
  formData.append('password', password);
  formData.append('test_date', testDate);
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
    const importResultData = await uploadDetailSheet(payload.session_code, payload.password, payload.test_date, file);
    saveOfficerSession(payload.session_code, payload.password, payload.test_date);
    syncSessionFields(payload.session_code, payload.password, payload.test_date);
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
  const testDate = document.getElementById('dashboardTestDate').value;

  if (!sessionCode || !password || !testDate) {
    alert('Please enter Session Code, Password, and Test Date.');
    return;
  }

  const res = await validateOfficerSession(sessionCode, password, testDate);
  const data = await res.json();
  if (!res.ok) {
    alert(data.detail || 'Unable to open dashboard.');
    return;
  }

  saveOfficerSession(sessionCode, password, testDate);
  window.location.href = '/conducting-officer/dashboard';
});

useRecentBtn.addEventListener('click', () => {
  const recentSessionCode = localStorage.getItem('officerSessionCode') || '';
  const recentPassword = localStorage.getItem('officerPassword') || '';
  const recentTestDate = localStorage.getItem('officerTestDate') || '';

  if (!recentSessionCode || !recentPassword || !recentTestDate) {
    alert('No recent session found on this device.');
    return;
  }

  syncSessionFields(recentSessionCode.toUpperCase(), recentPassword, recentTestDate);
  setImportResult('Recent session loaded. You can upload a corrected file or open dashboard.', false);
});

downloadTemplateBtn.addEventListener('click', () => {
  window.open('/api/officer/import-template', '_blank', 'noopener,noreferrer');
});

clearDetailSheetBtn.addEventListener('click', async () => {
  const sessionCode = document.getElementById('sessionCode').value.trim().toUpperCase();
  const password = document.getElementById('password').value;
  const testDate = document.getElementById('testDate').value;

  if (!sessionCode || !password || !testDate) {
    setImportResult('Please enter Session Code, Password, and Test Date in the create section before clearing.', true);
    return;
  }

  const confirmed = window.confirm('Clear imported details and related station scores for this session?');
  if (!confirmed) {
    return;
  }

  const res = await fetch('/api/officer/import-details/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode, password, test_date: testDate }),
  });
  const data = await res.json();

  if (!res.ok) {
    setImportResult(data.detail || 'Failed to clear imported details.', true);
    return;
  }

  saveOfficerSession(sessionCode, password, testDate);
  syncSessionFields(sessionCode, password, testDate);
  setImportResult(`Cleared ${data.deleted_profiles} detail rows and ${data.deleted_scores} score rows.`, false);
});
