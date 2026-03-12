const express = require('express');
const cors = require('cors');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 8085;
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let client;

async function getRedis() {
  if (!client) {
    client = redis.createClient({ url: redisUrl });
    client.on('error', (e) => console.error('Redis error', e));
    await client.connect();
  }
  return client;
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'notification', method: req.method, path: req.path, status: res.statusCode, duration_ms: Date.now() - start }));
  });
  next();
});

app.get('/health', async (req, res) => {
  try {
    const r = await getRedis();
    await r.ping();
    res.json({ status: 'ok', service: 'notification', redis: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'error', redis: e.message });
  }
});

app.post('/events', async (req, res) => {
  const event = req.body || {};
  try {
    const r = await getRedis();
    await r.lPush('events', JSON.stringify({ ...event, at: new Date().toISOString() }));
    await r.lTrim('events', 0, 999);
    res.status(202).json({ received: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/events', async (req, res) => {
  try {
    const r = await getRedis();
    const raw = await r.lRange('events', 0, 49);
    const events = raw.map((s) => {
      try { return JSON.parse(s); } catch { return { raw: s }; }
    });
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Notification service listening on ${PORT}`);
});
