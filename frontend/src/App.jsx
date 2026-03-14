import React, { useState, useEffect } from 'react';
import { API } from './api';
import './App.css';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80';
const PRODUCT_IMAGE = (id) => `https://picsum.photos/400/300?random=${id}`;

function ProductImage({ id, name }) {
  const [err, setErr] = React.useState(false);
  if (err) {
    return (
      <div className="product-card-image product-card-image-fallback" aria-hidden>
        <span>📦</span>
      </div>
    );
  }
  return (
    <img
      src={PRODUCT_IMAGE(id)}
      alt={name}
      className="product-card-image"
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin' });
  const [orderForm, setOrderForm] = useState({ user_id: 1, product_id: 1, quantity: 1 });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('catalog');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) setUser({ username: 'admin' });
  }, []);

  useEffect(() => {
    window.addEventListener('auth-logout', () => setToken(null));
    return () => window.removeEventListener('auth-logout', () => setToken(null));
  }, []);

  useEffect(() => {
    API.get('/health').then((r) => setHealth(r.data)).catch(() => setHealth({ error: 'Gateway unreachable' }));
  }, []);

  useEffect(() => {
    if (activeTab === 'catalog') loadProducts();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'events') loadEvents();
  }, [activeTab]);

  const loadProducts = () => API.get('/products').then((r) => setProducts(r.data)).catch((e) => setError(e.message));
  const loadUsers = () => API.get('/users').then((r) => setUsers(r.data)).catch((e) => setError(e.message));
  const loadOrders = () => API.get('/orders').then((r) => setOrders(r.data)).catch((e) => setError(e.message));
  const loadEvents = () => API.get('/events').then((r) => setEvents(r.data)).catch((e) => setError(e.message));

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    API.post('/auth/login', loginForm)
      .then((r) => {
        setToken(r.data.token);
        setUser({ username: r.data.username, role: r.data.role });
        localStorage.setItem('token', r.data.token);
      })
      .catch((e) => setError(e.response?.data?.error || 'Ошибка входа'));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleCreateOrder = (e, productId, userId = 1, qty = 1) => {
    e.preventDefault();
    setError('');
    const payload = productId != null
      ? { user_id: userId, product_id: productId, quantity: qty }
      : orderForm;
    API.post('/orders', payload)
      .then(() => {
        loadOrders();
        loadEvents();
        if (productId == null) setOrderForm((f) => ({ ...f, quantity: 1 }));
      })
      .catch((e) => setError(e.response?.data?.error || 'Ошибка создания заказа'));
  };

  const nav = [
    { id: 'catalog', label: 'Каталог', icon: '📦' },
    { id: 'orders', label: 'Мои заказы', icon: '📋' },
    { id: 'users', label: 'Пользователи', icon: '👥' },
    { id: 'events', label: 'События', icon: '🔔' },
    { id: 'health', label: 'Состояние', icon: '❤️' },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <button type="button" className="logo" onClick={() => setActiveTab('catalog')} aria-label="На главную">
            <span className="logo-icon">🛒</span>
            <span className="logo-text">Маркетплейс</span>
          </button>
          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            {nav.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`nav-link ${activeTab === t.id ? 'nav-link-active' : ''}`}
                onClick={() => { setActiveTab(t.id); setMenuOpen(false); }}
              >
                <span className="nav-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            {token ? (
              <>
                <span className="user-badge">{user?.username}</span>
                <button type="button" className="btn btn-outline" onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <form className="login-inline" onSubmit={handleLogin}>
                <input
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="Логин"
                  className="input-inline"
                />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Пароль"
                  className="input-inline"
                />
                <button type="submit" className="btn btn-primary">Войти</button>
              </form>
            )}
          </div>
          <button type="button" className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
          <button type="button" className="banner-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {activeTab === 'catalog' && (
        <>
          <section className="hero">
            <div className="hero-bg" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
            <div className="hero-overlay" />
            <div className="hero-content">
              <h1 className="hero-title">Товары и заказы</h1>
              <p className="hero-subtitle">Демо-приложение на микросервисах. Каталог, заказы и события в одном месте.</p>
              <button type="button" className="btn btn-hero" onClick={loadProducts}>
                Загрузить каталог
              </button>
            </div>
          </section>

          <main className="main">
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Каталог товаров</h2>
                <button type="button" className="btn btn-secondary" onClick={loadProducts}>Обновить</button>
              </div>
              <div className="product-grid">
                {products.map((p) => (
                  <article key={p.id} className="product-card">
                    <div className="product-card-image-wrap">
                      <ProductImage id={p.id} name={p.name} />
                      <span className="product-card-badge">В наличии: {p.stock}</span>
                    </div>
                    <div className="product-card-body">
                      <h3 className="product-card-title">{p.name}</h3>
                      <p className="product-card-price">{Number(p.price).toFixed(2)} ₽</p>
                      {token && (
                        <form onSubmit={(e) => handleCreateOrder(e, p.id, 1, 1)} className="product-card-form">
                          <button type="submit" className="btn btn-primary btn-block">Заказать</button>
                        </form>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {products.length === 0 && (
                <p className="empty-state">Нажмите «Загрузить каталог» или «Обновить», чтобы показать товары.</p>
              )}
            </section>
          </main>
        </>
      )}

      {activeTab !== 'catalog' && (
        <main className="main main-inner">
          {activeTab === 'orders' && (
            <section className="section card">
              <h2 className="section-title">Мои заказы</h2>
              {token && (
                <form className="form-block" onSubmit={(e) => handleCreateOrder(e, null)}>
                  <div className="form-row">
                    <label>User ID <input type="number" min="1" value={orderForm.user_id} onChange={(e) => setOrderForm((f) => ({ ...f, user_id: +e.target.value }))} className="input-narrow" /></label>
                    <label>Product ID <input type="number" min="1" value={orderForm.product_id} onChange={(e) => setOrderForm((f) => ({ ...f, product_id: +e.target.value }))} className="input-narrow" /></label>
                    <label>Кол-во <input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm((f) => ({ ...f, quantity: +e.target.value }))} className="input-narrow" /></label>
                    <button type="submit" className="btn btn-primary">Создать заказ</button>
                  </div>
                </form>
              )}
              <button type="button" className="btn btn-secondary" onClick={loadOrders}>Обновить</button>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ID</th><th>User</th><th>Товар</th><th>Кол-во</th><th>Статус</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}><td>{o.id}</td><td>{o.user_id}</td><td>{o.product_id}</td><td>{o.quantity}</td><td>{o.status}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className="section card">
              <h2 className="section-title">Пользователи</h2>
              <button type="button" className="btn btn-secondary" onClick={loadUsers}>Обновить</button>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ID</th><th>Логин</th><th>Email</th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email || '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'events' && (
            <section className="section card">
              <h2 className="section-title">События (логи)</h2>
              <button type="button" className="btn btn-secondary" onClick={loadEvents}>Обновить</button>
              <ul className="event-list">
                {events.slice(0, 20).map((e, i) => (
                  <li key={i} className="event-item">{e.type || 'event'} {e.at && new Date(e.at).toLocaleString()} {JSON.stringify(e)}</li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === 'health' && (
            <section className="section card">
              <h2 className="section-title">Состояние сервисов</h2>
              <button type="button" className="btn btn-secondary" onClick={() => API.get('/health').then((r) => setHealth(r.data))}>Обновить</button>
              <pre className="health-json">{JSON.stringify(health, null, 2)}</pre>
            </section>
          )}
        </main>
      )}

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>Каталог</h4>
            <button type="button" className="footer-link" onClick={() => setActiveTab('catalog')}>Товары</button>
          </div>
          <div className="footer-col">
            <h4>Аккаунт</h4>
            <button type="button" className="footer-link" onClick={() => setActiveTab('orders')}>Заказы</button>
          </div>
          <div className="footer-col">
            <h4>Демо</h4>
            <span className="footer-muted">Микросервисы · OpenShift/K8s</span>
          </div>
          <div className="footer-bottom">
            <span>© Маркетплейс — учебный проект</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
