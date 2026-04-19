const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARBOX_KEY = process.env.ARBOX_KEY || 'hFRSXRZb-L0aF-5QzU-ByG6-RQoYZxgfXJDl';
const ARBOX_BASE = 'https://api.arboxapp.com/index.php/api/v2';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/*', async (req, res) => {
  const endpoint = req.path.replace('/api', '');
  const query = new URLSearchParams(req.query).toString();
  const url = `${ARBOX_BASE}${endpoint}${query ? '?' + query : ''}`;
  try {
    const response = await fetch(url, {
      headers: { 'authtoken': ARBOX_KEY, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/debug', (req, res) => res.json({ key: ARBOX_KEY ? ARBOX_KEY.substring(0,5) + '...' : 'EMPTY' }));

app.listen(PORT, () => console.log('Server running on port ' + PORT));
