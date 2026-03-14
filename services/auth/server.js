const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8081;
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-change-in-production';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'auth', method: req.method, path: req.path, status: res.statusCode, duration_ms: Date.now() - start }));
  });
  next();
});

// In-memory пользователи (логин/пароль/email). В проде — БД и хэш пароля.
const users = new Map([
  ['admin', { password: 'admin', email: 'admin@example.com', role: 'admin' }],
  ['user1', { password: 'user1', email: 'user1@example.com', role: 'user' }],
]);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

// Регистрация: имя пользователя, пароль (любая длина), email (необязательно)
app.post('/register', (req, res) => {
  const body = req.body || {};
  const username = body.username != null ? String(body.username).trim() : '';
  const password = body.password != null ? String(body.password) : '';
  const email = body.email != null ? String(body.email).trim() : '';

  if (!username) {
    return res.status(400).json({ error: 'Введите имя пользователя' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Введите пароль' });
  }
  if (users.has(username)) {
    return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
  }

  users.set(username, { password, email: email || null, role: 'user' });
  res.status(201).json({ message: 'Регистрация успешна', username });
});

app.post('/login', (req, res) => {
  const body = req.body || {};
  const username = body.username != null ? String(body.username).trim() : '';
  const password = body.password != null ? String(body.password) : '';
  if (!username) {
    return res.status(400).json({ error: 'Введите логин' });
  }
  const u = users.get(username);
  if (!u || u.password !== password) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
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
