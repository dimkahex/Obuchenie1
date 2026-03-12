/**
 * Имитация активности пользователей: периодические запросы к API.
 * Нужно для мониторинга — в логах и метриках появляется стабильный трафик.
 */
const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://api-gateway:8080';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '30000', 10); // 30 сек

const api = axios.create({
  baseURL: GATEWAY_URL,
  timeout: 10000,
  headers: { 'User-Agent': 'synthetic-load/1.0' },
});

function log(msg, data = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: 'synthetic-load',
    message: msg,
    ...data,
  });
  console.log(line);
}

async function runCycle() {
  let token = null;
  try {
    // Логин
    const loginRes = await api.post('/api/auth/login', { username: 'admin', password: 'admin' });
    token = loginRes.data.token;
    log('login_ok', { user: loginRes.data.username });

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // Каталог
    const productsRes = await api.get('/api/products', authHeader);
    log('products_fetched', { count: productsRes.data?.length ?? 0 });

    // Пользователи
    const usersRes = await api.get('/api/users', authHeader);
    log('users_fetched', { count: usersRes.data?.length ?? 0 });

    // Создать заказ (имитация действия пользователя)
    const products = productsRes.data || [];
    const users = usersRes.data || [];
    if (products.length > 0 && users.length > 0) {
      const productId = products[0].id;
      const userId = users[0].id;
      const quantity = Math.min(1, Math.max(1, Math.floor(Math.random() * 2) + 1));
      await api.post(
        '/api/orders',
        { user_id: userId, product_id: productId, quantity },
        authHeader
      );
      log('order_created', { user_id: userId, product_id: productId, quantity });
    }

    // События
    const eventsRes = await api.get('/api/events', authHeader);
    log('events_fetched', { count: eventsRes.data?.length ?? 0 });

    // Health (для метрик доступности)
    await api.get('/api/health');
    log('health_check_ok');
  } catch (err) {
    log('cycle_error', {
      error: err.message,
      code: err.code,
      status: err.response?.status,
    });
  }
}

log('synthetic_load_started', { gateway: GATEWAY_URL, interval_ms: INTERVAL_MS });

setInterval(runCycle, INTERVAL_MS);
runCycle(); // первый цикл сразу
