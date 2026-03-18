import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ROLE_ROUTES = {
  OWNER: '/dashboard/owner',
  REGIONAL_MANAGER: '/dashboard/rm',
  MANAGER: '/dashboard/manager',
  SALESMAN: '/dashboard/salesman',
  TECHNICIAN: '/dashboard/technician',
};

export default function LoginPage() {
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      login(res.data.token, res.data.user);
      navigate(ROLE_ROUTES[res.data.user.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.status === 403 && msg.toLowerCase().includes('pending')) {
        navigate('/pending');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
      <div className="card">
        <h2>Login</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mobile</label>
            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              required
              placeholder="9876543210"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
          <Link to="/forgot-password">Forgot password?</Link>
          {' · '}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
