import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const ROLES = ['OWNER', 'REGIONAL_MANAGER', 'MANAGER', 'SALESMAN', 'TECHNICIAN'];
const ROLES_NEEDING_ZONE = ['REGIONAL_MANAGER', 'MANAGER', 'SALESMAN', 'TECHNICIAN'];
const ROLES_NEEDING_BRANCH = ['MANAGER', 'SALESMAN', 'TECHNICIAN'];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: '',
    zoneId: '',
    branchId: '',
  });
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ROLES_NEEDING_ZONE.includes(form.role)) {
      api.get('/api/zones').then((r) => setZones(r.data)).catch(() => setZones([]));
    } else {
      setZones([]);
      setForm((f) => ({ ...f, zoneId: '', branchId: '' }));
    }
  }, [form.role]);

  useEffect(() => {
    if (ROLES_NEEDING_BRANCH.includes(form.role) && form.zoneId) {
      api.get(`/api/branches?zoneId=${form.zoneId}`)
        .then((r) => setBranches(r.data))
        .catch(() => setBranches([]));
    } else {
      setBranches([]);
      setForm((f) => ({ ...f, branchId: '' }));
    }
  }, [form.role, form.zoneId]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Mobile must be exactly 10 digits');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.role) {
      setError('Please select a role');
      return;
    }
    if (ROLES_NEEDING_ZONE.includes(form.role) && !form.zoneId) {
      setError('Please select a zone');
      return;
    }
    if (ROLES_NEEDING_BRANCH.includes(form.role) && !form.branchId) {
      setError('Please select a branch');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        password: form.password,
        role: form.role,
      };
      if (form.zoneId) payload.zoneId = form.zoneId;
      if (form.branchId) payload.branchId = form.branchId;

      const res = await api.post('/api/auth/register', payload);
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(success.employeeId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (success) {
    return (
      <div className="container" style={{ maxWidth: 480, marginTop: 80 }}>
        <div className="card">
          <h2>Registration Successful</h2>
          <div className="alert alert-success" style={{ marginTop: 8 }}>
            {success.message}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Your Employee ID:</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
                {success.employeeId}
              </code>
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
              Save this ID — you'll need it to log in and reset your password.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 60 }}>
      <div className="card">
        <h2>Register</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>Mobile (10 digits)</label>
            <input name="mobile" value={form.mobile} onChange={handleChange} required placeholder="9876543210" maxLength={10} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange} required>
              <option value="">Select a role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          {ROLES_NEEDING_ZONE.includes(form.role) && (
            <div className="form-group">
              <label>Zone</label>
              <select name="zoneId" value={form.zoneId} onChange={handleChange} required>
                <option value="">Select a zone</option>
                {zones.map((z) => (
                  <option key={z._id} value={z._id}>{z.name}</option>
                ))}
              </select>
            </div>
          )}
          {ROLES_NEEDING_BRANCH.includes(form.role) && (
            <div className="form-group">
              <label>Branch</label>
              <select name="branchId" value={form.branchId} onChange={handleChange} required disabled={!form.zoneId}>
                <option value="">Select a branch</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
