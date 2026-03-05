const loginBtn = document.getElementById('loginBtn');

loginBtn.addEventListener('click', async () => {
  const session_code = document.getElementById('sessionCode').value.trim();
  const password = document.getElementById('password').value;
  const station = document.getElementById('station').value;

  if (!session_code || !password || !station) {
    alert('Please enter Session Code, Password, and Assigned Station.');
    return;
  }

  const res = await fetch('/api/commander/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_code, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.detail || 'Login failed.');
    return;
  }

  sessionStorage.setItem('commanderSessionCode', session_code);
  sessionStorage.setItem('commanderPassword', password);
  sessionStorage.setItem('commanderStation', station);
  window.location.href = '/commander/dashboard';
});
