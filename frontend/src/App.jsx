import React, { useState, useEffect } from 'react';
import { API } from './api';
import './App.css';

const PRODUCT_IMAGE = (id) => `https://picsum.photos/400/400?random=${id}`;

function ProductImage({ id, name }) {
  const [err, setErr] = React.useState(false);
  if (err) {
    return (
      <div className="product-card-image product-card-image-fallback" aria-hidden>
        📦
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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', email: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    API.get('/health').then((r) => setHealth(r.data)).catch(() => setHealth({ error: 'Нет связи' }));
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
        setLoginModalOpen(false);
      })
      .catch((e) => setError(e.response?.data?.error || 'Ошибка входа'));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    API.post('/auth/register', registerForm)
      .then(() => {
        setRegisterModalOpen(false);
        setRegisterForm({ username: '', password: '', email: '' });
        setLoginModalOpen(true);
        setError('');
        setSuccessMsg('Регистрация успешна. Войдите под новым пользователем.');
        setTimeout(() => setSuccessMsg(''), 5000);
      })
      .catch((e) => setError(e.response?.data?.error || 'Ошибка регистрации'));
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
      .catch((e) => setError(e.response?.data?.error || 'Ошибка заказа'));
  };

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : products;

  const tabs = [
    { id: 'catalog', label: 'Каталог' },
    { id: 'orders', label: 'Мои заказы' },
    { id: 'users', label: 'Пользователи' },
    { id: 'events', label: 'События' },
    { id: 'health', label: 'Состояние системы' },
  ];

  return (
    <div className="app">
      {/* Верхняя панель */}
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="logo" onClick={() => setActiveTab('catalog')}>
            <div className="logo-icon">🛒</div>
            <span className="logo-text">ТехноМаркет</span>
          </button>
          <div className="search-wrap">
            <span className="search-icon" aria-hidden>🔍</span>
            <input
              type="search"
              className="search-input"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Поиск"
            />
          </div>
          <a href="tel:+78001234567" className="topbar-phone">8 800 123-45-67</a>
          <button type="button" className="topbar-cart" onClick={() => setActiveTab('orders')}>
            <span>📋</span> Заказы
          </button>
          <div className="topbar-right">
            {token ? (
              <div className="user-bar">
                <span className="user-name">{user?.username}</span>
                <button type="button" className="btn-logout" onClick={handleLogout}>Выйти</button>
              </div>
            ) : (
              <>
                <button type="button" className="btn-login" onClick={() => setRegisterModalOpen(true)}>
                  Регистрация
                </button>
                <button type="button" className="btn-login" onClick={() => setLoginModalOpen(true)}>
                  Войти
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Вкладки навигации */}
      <nav className="nav-bar">
        <div className="nav-inner">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`nav-tab ${activeTab === t.id ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {error && (
        <div className="banner-error" role="alert">
          {error}
          <button type="button" className="banner-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="banner-success" role="status">
          {successMsg}
          <button type="button" className="banner-close" onClick={() => setSuccessMsg('')}>×</button>
        </div>
      )}

      {/* Промо-баннер (только на каталоге) */}
      {activeTab === 'catalog' && (
        <section className="promo">
          <div className="promo-text">
            <h2>Товары по выгодным ценам</h2>
            <p>Демо-магазин на микросервисах. Каталог, заказы и доставка.</p>
          </div>
          <button type="button" className="promo-btn" onClick={loadProducts}>
            Смотреть каталог
          </button>
        </section>
      )}

      {/* Контент */}
      <main className="main">
        {activeTab === 'catalog' && (
          <>
            <div className="section-actions">
              <h2 className="section-title">Каталог товаров</h2>
              <button type="button" className="btn btn-secondary" onClick={loadProducts}>Обновить</button>
            </div>
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <article key={p.id} className="product-card">
                  <div className="product-card-image-wrap">
                    <ProductImage id={p.id} name={p.name} />
                    {p.stock > 0 && p.stock <= 5 && (
                      <span className="product-card-badge">Осталось {p.stock}</span>
                    )}
                  </div>
                  <div className="product-card-body">
                    <h3 className="product-card-title">{p.name}</h3>
                    <p className="product-card-price">{Number(p.price).toFixed(0)} ₽</p>
                    <p className="product-card-stock">В наличии: {p.stock} шт.</p>
                    {token ? (
                      <form onSubmit={(e) => handleCreateOrder(e, p.id, 1, 1)}>
                        <button type="submit" className="product-card-btn" disabled={p.stock < 1}>
                          В корзину
                        </button>
                      </form>
                    ) : (
                      <button type="button" className="product-card-btn" onClick={() => setLoginModalOpen(true)}>
                        Войти, чтобы заказать
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {products.length === 0 && (
              <p className="empty-state">
                Каталог пуст. Нажмите «Смотреть каталог» или «Обновить».
                <br />
                <button type="button" className="btn btn-primary" onClick={loadProducts}>Загрузить каталог</button>
              </p>
            )}
            {products.length > 0 && filteredProducts.length === 0 && (
              <p className="empty-state">По запросу «{searchQuery}» ничего не найдено.</p>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <section>
            <h2 className="section-title">Мои заказы</h2>
            {token && (
              <form className="form-row" onSubmit={(e) => handleCreateOrder(e, null)}>
                <label>User ID <input type="number" min="1" value={orderForm.user_id} onChange={(e) => setOrderForm((f) => ({ ...f, user_id: +e.target.value }))} className="input-narrow" /></label>
                <label>Товар ID <input type="number" min="1" value={orderForm.product_id} onChange={(e) => setOrderForm((f) => ({ ...f, product_id: +e.target.value }))} className="input-narrow" /></label>
                <label>Кол-во <input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm((f) => ({ ...f, quantity: +e.target.value }))} className="input-narrow" /></label>
                <button type="submit" className="btn btn-primary">Оформить заказ</button>
              </form>
            )}
            <button type="button" className="btn btn-secondary" onClick={loadOrders}>Обновить</button>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>№</th><th>Пользователь</th><th>Товар</th><th>Кол-во</th><th>Статус</th></tr></thead>
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
          <section>
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
          <section>
            <h2 className="section-title">События системы</h2>
            <button type="button" className="btn btn-secondary" onClick={loadEvents}>Обновить</button>
            <ul className="event-list">
              {events.slice(0, 25).map((e, i) => (
                <li key={i} className="event-item">{e.type || 'event'} · {e.at && new Date(e.at).toLocaleString()} — {JSON.stringify(e)}</li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === 'health' && (
          <section>
            <h2 className="section-title">Состояние сервисов</h2>
            <button type="button" className="btn btn-secondary" onClick={() => API.get('/health').then((r) => setHealth(r.data))}>Обновить</button>
            <pre className="health-json">{JSON.stringify(health, null, 2)}</pre>
          </section>
        )}
      </main>

      {/* Модальное окно входа */}
      {loginModalOpen && (
        <div className="modal-overlay" onClick={() => setLoginModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Вход в аккаунт</h3>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Имя пользователя (логин)</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                  autoComplete="username"
                  placeholder="admin"
                />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <p className="modal-switch">
                Нет аккаунта?{' '}
                <button type="button" className="link-btn" onClick={() => { setLoginModalOpen(false); setRegisterModalOpen(true); }}>
                  Зарегистрироваться
                </button>
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-close-modal" onClick={() => setLoginModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Войти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно регистрации */}
      {registerModalOpen && (
        <div className="modal-overlay" onClick={() => setRegisterModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Регистрация</h3>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Имя пользователя</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, username: e.target.value }))}
                  autoComplete="username"
                  placeholder="Придумайте логин"
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  placeholder="Любая длина"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email (необязательно)</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  placeholder="example@mail.ru"
                />
              </div>
              <p className="modal-switch">
                Уже есть аккаунт?{' '}
                <button type="button" className="link-btn" onClick={() => { setRegisterModalOpen(false); setLoginModalOpen(true); }}>
                  Войти
                </button>
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-close-modal" onClick={() => setRegisterModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Зарегистрироваться</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Подвал */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>Магазин</h4>
              <button type="button" className="footer-link" onClick={() => setActiveTab('catalog')}>Каталог</button>
              <button type="button" className="footer-link" onClick={() => setActiveTab('orders')}>Заказы</button>
            </div>
            <div className="footer-col">
              <h4>Помощь</h4>
              <span className="footer-link" style={{ cursor: 'default' }}>8 800 123-45-67</span>
            </div>
            <div className="footer-col">
              <h4>Демо</h4>
              <span className="footer-link" style={{ cursor: 'default', color: '#6e6e73' }}>Микросервисы · OpenShift</span>
            </div>
            <div className="footer-col">
              <h4>Аккаунт</h4>
              {token ? (
                <button type="button" className="footer-link" onClick={handleLogout}>Выйти</button>
              ) : (
                <>
                  <button type="button" className="footer-link" onClick={() => setRegisterModalOpen(true)}>Регистрация</button>
                  <button type="button" className="footer-link" onClick={() => setLoginModalOpen(true)}>Войти</button>
                </>
              )}
            </div>
          </div>
          <div className="footer-bottom">
            © ТехноМаркет — учебный проект. Демо микросервисной архитектуры.
          </div>
        </div>
      </footer>
    </div>
  );
}
