import React, { useState, useEffect } from 'react';
import { API } from './api';
import './App.css';

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

  const handleCreateOrder = (e) => {
    e.preventDefault();
    setError('');
    API.post('/orders', orderForm)
      .then(() => {
        loadOrders();
        loadEvents();
        setOrderForm((f) => ({ ...f, quantity: 1 }));
      })
      .catch((e) => setError(e.response?.data?.error || 'Ошибка создания заказа'));
  };

  const tabs = [
    { id: 'catalog', label: 'Каталог' },
    { id: 'orders', label: 'Заказы' },
    { id: 'users', label: 'Пользователи' },
    { id: 'events', label: 'События' },
    { id: 'health', label: 'Состояние' },
  ];

  return (
    <div className="app">
      <header className="header">
        <h1>Микросервисы — демо</h1>
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
      </header>

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
          <button type="button" className="banner-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${activeTab === t.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === 'catalog' && (
          <section className="card">
            <h2>Каталог товаров</h2>
            <button type="button" className="btn btn-secondary" onClick={loadProducts}>Обновить</button>
            <div className="grid">
              {products.map((p) => (
                <div key={p.id} className="product-card">
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">{Number(p.price).toFixed(2)} ₽</div>
                  <div className="product-stock">В наличии: {p.stock}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="card">
            <h2>Заказы</h2>
            {token && (
              <form className="form-inline" onSubmit={handleCreateOrder}>
                <label>User ID <input type="number" min="1" value={orderForm.user_id} onChange={(e) => setOrderForm((f) => ({ ...f, user_id: +e.target.value }))} className="input-narrow" /></label>
                <label>Product ID <input type="number" min="1" value={orderForm.product_id} onChange={(e) => setOrderForm((f) => ({ ...f, product_id: +e.target.value }))} className="input-narrow" /></label>
                <label>Кол-во <input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm((f) => ({ ...f, quantity: +e.target.value }))} className="input-narrow" /></label>
                <button type="submit" className="btn btn-primary">Создать заказ</button>
              </form>
            )}
            <button type="button" className="btn btn-secondary" onClick={loadOrders}>Обновить</button>
            <table className="table">
              <thead><tr><th>ID</th><th>User</th><th>Товар</th><th>Кол-во</th><th>Статус</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}><td>{o.id}</td><td>{o.user_id}</td><td>{o.product_id}</td><td>{o.quantity}</td><td>{o.status}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="card">
            <h2>Пользователи</h2>
            <button type="button" className="btn btn-secondary" onClick={loadUsers}>Обновить</button>
            <table className="table">
              <thead><tr><th>ID</th><th>Логин</th><th>Email</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'events' && (
          <section className="card">
            <h2>События (логи)</h2>
            <button type="button" className="btn btn-secondary" onClick={loadEvents}>Обновить</button>
            <ul className="event-list">
              {events.slice(0, 20).map((e, i) => (
                <li key={i} className="event-item">{e.type || 'event'} {e.at && new Date(e.at).toLocaleString()} {JSON.stringify(e)}</li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === 'health' && (
          <section className="card">
            <h2>Состояние сервисов</h2>
            <button type="button" className="btn btn-secondary" onClick={() => API.get('/health').then((r) => setHealth(r.data))}>Обновить</button>
            <pre className="health-json">{JSON.stringify(health, null, 2)}</pre>
          </section>
        )}
      </main>
    </div>
  );
}
