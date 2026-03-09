import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API = axios.create({ baseURL: API_BASE, timeout: 5000 });

export default function App() {
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin' });

  useEffect(() => {
    API.get('/health').then((r) => setHealth(r.data)).catch(() => setHealth({ error: 'Gateway unreachable' }));
  }, []);

  const loadProducts = () => API.get('/products').then((r) => setProducts(r.data)).catch(console.error);
  const loadUsers = () => API.get('/users').then((r) => setUsers(r.data)).catch(console.error);
  const loadOrders = () => API.get('/orders').then((r) => setOrders(r.data)).catch(console.error);
  const loadEvents = () => API.get('/events').then((r) => setEvents(r.data)).catch(console.error);

  const handleLogin = (e) => {
    e.preventDefault();
    API.post('/auth/login', loginForm)
      .then((r) => {
        setToken(r.data.token);
        localStorage.setItem('token', r.data.token);
      })
      .catch((e) => alert(e.response?.data?.error || 'Login failed'));
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <div>
      <h1>Microservices Demo (OpenShift)</h1>

      <section>
        <h2>Health</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
        <button onClick={() => API.get('/health').then((r) => setHealth(r.data)).catch(() => setHealth({ error: 'fail' }))}>
          Refresh
        </button>
      </section>

      <section>
        <h2>Auth</h2>
        {token ? (
          <p>Logged in. <button onClick={handleLogout}>Logout</button></p>
        ) : (
          <form onSubmit={handleLogin}>
            <input
              value={loginForm.username}
              onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="Username"
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Password"
            />
            <button type="submit">Login</button>
          </form>
        )}
      </section>

      <section>
        <h2>Catalog (Products)</h2>
        <button onClick={loadProducts}>Load products</button>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.price}</td><td>{p.stock}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Users</h2>
        <button onClick={loadUsers}>Load users</button>
        <table>
          <thead><tr><th>ID</th><th>Username</th><th>Email</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email || '-'}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Orders</h2>
        <button onClick={loadOrders}>Load orders</button>
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Product</th><th>Qty</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}><td>{o.id}</td><td>{o.user_id}</td><td>{o.product_id}</td><td>{o.quantity}</td><td>{o.status}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Events (Notifications)</h2>
        <button onClick={loadEvents}>Load events</button>
        <ul>{events.slice(0, 10).map((e, i) => <li key={i}>{JSON.stringify(e)}</li>)}</ul>
      </section>
    </div>
  );
}
