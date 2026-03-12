const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8081';
const USER_URL = process.env.USER_SERVICE_URL || 'http://user-service:8082';
const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8083';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:8084';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8085';

app.use(cors());
app.use(express.json());

// Структурированные логи для мониторинга (ELK, Loki, Prometheus tail)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = JSON.stringify({
      ts: new Date().toISOString(),
      service: 'api-gateway',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
    });
    console.log(log);
  });
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

app.get('/api/health', async (req, res) => {
  const services = [
    { name: 'auth', url: AUTH_URL },
    { name: 'user', url: USER_URL },
    { name: 'catalog', url: CATALOG_URL },
    { name: 'order', url: ORDER_URL },
    { name: 'notification', url: NOTIFICATION_URL },
  ];
  const results = await Promise.allSettled(
    services.map((s) => axios.get(`${s.url}/health`, { timeout: 2000 }).then((r) => r.data))
  );
  res.json({
    gateway: 'ok',
    services: services.map((s, i) => ({
      name: s.name,
      status: results[i].status === 'fulfilled' ? results[i].value : { error: results[i].reason?.message },
    })),
  });
});

app.use('/api/auth', createProxyMiddleware({ target: AUTH_URL, pathRewrite: { '^/api/auth': '' } }));
app.use('/api/users', createProxyMiddleware({ target: USER_URL, pathRewrite: { '^/api/users': '/users' } }));
app.use('/api/products', createProxyMiddleware({ target: CATALOG_URL, pathRewrite: { '^/api/products': '/products' } }));
app.use('/api/orders', createProxyMiddleware({ target: ORDER_URL, pathRewrite: { '^/api/orders': '/orders' } }));
app.use('/api/events', createProxyMiddleware({ target: NOTIFICATION_URL, pathRewrite: { '^/api/events': '/events' } }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway listening on ${PORT}`);
});
