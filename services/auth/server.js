const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8081;
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-change-in-production';

app.use(cors());
app.use(express.json());

// In-memory "users" for demo (in real app - DB)
const users = new Map([
  ['admin', { password: 'admin', role: 'admin' }],
  ['user1', { password: 'user1', role: 'user' }],
]);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = users.get(username);
  if (!u || u.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { sub: username, role: u.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token, username, role: u.role });
});

app.get('/verify', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, username: payload.sub, role: payload.role });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth service listening on ${PORT}`);
});
