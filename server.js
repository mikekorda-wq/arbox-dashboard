const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARBOX_EMAIL = process.env.ARBOX_EMAIL || '';
const ARBOX_PASSWORD = process.env.ARBOX_PASSWORD || '';
const ARBOX_KEY = process.env.ARBOX_KEY || 'hFRSXRZb-L0aF-5QzU-ByG6-RQoYZxgfXJDl';
const ARBOX_BASE = 'https://api.arboxapp.com/index.php/api/v2';

let authToken = null;
let tokenExpiry = 0;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function getToken() {
  if (authToken && Date.now() < tokenExpiry) return authToken;
  if (ARBOX_EMAIL && ARBOX_PASSWORD) {
    try {
      const res = await fetch(`${ARBOX_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ARBOX_EMAIL, password: ARBOX_PASSWORD })
      });
      const data = await res.json();
      if (data.data && data.data.token) {
        authToken = data.data.token;
        tokenExpiry = Date.now() + 3600000;
        return authToken;
      }
    } catch(e) { console.log('Login failed:', e.message); }
  }
  return ARBOX_KEY;
}

app.get('/api/*', async (req, res) => {
  const endpoint = req.path.replace('/api', '');
  const query = new URLSearchParams(req.query).toString();
  const url = `${ARBOX_BASE}${endpoint}${query ? '?' + query : ''}`;
  const token = await getToken();
  try {
    const response = await fetch(url, {
      headers: {
        'authtoken': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug', async (req, res) => {
  const token = await getToken();
  res.json({
    key: ARBOX_KEY ? ARBOX_KEY.substring(0,8)+'...' : 'EMPTY',
    email: ARBOX_EMAIL || 'not set',
    hasToken: !!authToken,
    usingToken: token.substring(0,8)+'...'
  });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
