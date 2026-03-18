import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import LocationCapture from '../components/LocationCapture';

const TABS = ['My Customers', 'Add Customer'];

function MyCustomers({ customers, loading }) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>My Customers</h3>
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr><th>Name</th><th>Mobile</th><th>Location</th><th>Date</th></tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={4} className="text-center" style={{ color: '#6b7280' }}>No customers yet</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.mobile}</td>
                <td>
                  {c.location?.coordinates
                    ? `${c.location.coordinates[1].toFixed(4)}, ${c.location.coordinates[0].toFixed(4)}`
                    : '—'}
                </td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AddCustomer({ onAdded }) {
  const [form, setForm] = useState({ name: '', mobile: '' });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        capturedAt: new Date().toISOString(),
      };
      if (location) {
        payload.location = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        };
      }
      await api.post('/api/customers', payload);
      setSuccess('Customer added successfully!');
      setForm({ name: '', mobile: '' });
      setLocation(null);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3>Add New Customer</h3>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Customer Name</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Full name" />
        </div>
        <div className="form-group">
          <label>Mobile</label>
          <input name="mobile" value={form.mobile} onChange={handleChange} required placeholder="9876543210" />
        </div>
        <div className="form-group">
          <label>Location</label>
          <LocationCapture onCapture={setLocation} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Customer'}
        </button>
      </form>
    </div>
  );
}

export default function SalesmanDashboard() {
  const [tab, setTab] = useState('My Customers');
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await api.get('/api/customers');
      setCustomers(res.data);
    } catch {
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: 24 }}>
        <h1 className="page-title">Salesman Dashboard</h1>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        {tab === 'My Customers' && <MyCustomers customers={customers} loading={loadingCustomers} />}
        {tab === 'Add Customer' && <AddCustomer onAdded={() => { fetchCustomers(); setTab('My Customers'); }} />}
      </div>
    </>
  );
}
