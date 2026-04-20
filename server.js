const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARBOX_EMAIL = process.env.ARBOX_EMAIL || '';
const ARBOX_PASSWORD = process.env.ARBOX_PASSWORD || '';
const BOX_ID = process.env.BOX_ID || '17857';
const ARBOX_BASE = 'https://api.arboxapp.com/index.php/api/v1';
const ARBOX_LOGIN_URL = 'https://arboxserver.arboxapp.com/api/v2/login';

let accessToken = null;
let tokenExpiry = 0;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  try {
    const res = await fetch(ARBOX_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: ARBOX_EMAIL, password: ARBOX_PASSWORD })
    });
    const data = await res.json();
    console.log('Login response:', JSON.stringify(data).substring(0, 300));
    const token = data.data?.token || data.data?.accessToken || data.token || data.accessToken;
    if (token) {
      accessToken = token;
      tokenExpiry = Date.now() + 3600000;
      console.log('Got token successfully!');
      return accessToken;
    } else {
      console.log('No token in response:', JSON.stringify(data).substring(0, 200));
    }
  } catch(e) {
    console.log('Login error:', e.message);
  }
  return null;
}

app.get('/api/*', async (req, res) => {
  const endpoint = req.path.replace('/api', '');
  const query = new URLSearchParams(req.query).toString();
  const url = `${ARBOX_BASE}/box/${BOX_ID}${endpoint}${query ? '?' + query : ''}`;
  const token = await getAccessToken();
  console.log('Fetching:', url);
  try {
    const response = await fetch(url, {
      headers: {
        'Accesstoken': token || '',
        'Boxfk': BOX_ID,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug', async (req, res) => {
  const token = await getAccessToken();
  res.json({
    email: ARBOX_EMAIL || 'not set',
    boxId: BOX_ID,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
    loginUrl: ARBOX_LOGIN_URL,
    base: ARBOX_BASE
  });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
