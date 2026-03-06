const continueBtn = document.getElementById('continueBtn');

continueBtn.addEventListener('click', async () => {
  const sessionCode = document.getElementById('sessionCode').value.trim().toUpperCase();
  if (!sessionCode) {
    alert('Please enter Session Code.');
    return;
  }

  const res = await fetch('/api/soldier/session/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code: sessionCode }),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.detail || 'Invalid session code.');
    return;
  }

  sessionStorage.setItem('soldierSessionCode', sessionCode);
  window.location.href = '/soldier/details';
});
