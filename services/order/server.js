const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8084;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5434/orders',
});
const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8083';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8085';

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'order', db: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'error', db: e.message });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, user_id, product_id, quantity, status, created_at FROM orders ORDER BY created_at DESC'
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/orders', async (req, res) => {
  const { user_id, product_id, quantity } = req.body || {};
  if (!user_id || !product_id || quantity == null) {
    return res.status(400).json({ error: 'user_id, product_id, quantity required' });
  }
  try {
    const productRes = await axios.get(`${CATALOG_URL}/products/${product_id}`).catch(() => null);
    if (!productRes || productRes.data.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock or product not found' });
    }
    const r = await pool.query(
      'INSERT INTO orders (user_id, product_id, quantity, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, product_id, quantity, 'created']
    );
    const order = r.rows[0];
    axios.post(`${NOTIFICATION_URL}/events`, { type: 'order_created', order_id: order.id }).catch(() => {});
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Order service listening on ${PORT}`);
});
