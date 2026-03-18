import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import LocationCapture from '../components/LocationCapture';

const TABS = ['My Customers', 'Add Customer', 'My Services', 'Add Service'];
const SERVICE_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

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

function MyServices({ services, loading }) {
  const badgeClass = { OPEN: 'badge-pending', IN_PROGRESS: 'badge-approved', CLOSED: 'badge-rejected' };
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>My Services</h3>
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr><th>Customer</th><th>Mobile</th><th>Title</th><th>Notes</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {services.length === 0 && (
              <tr><td colSpan={6} className="text-center" style={{ color: '#6b7280' }}>No services yet</td></tr>
            )}
            {services.map((s) => (
              <tr key={s._id}>
                <td>{s.customerName}</td>
                <td>{s.mobile || '—'}</td>
                <td>{s.title}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.notes || '—'}
                </td>
                <td><span className={`badge ${badgeClass[s.status] || ''}`}>{s.status}</span></td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AddService({ onAdded }) {
  const [form, setForm] = useState({ customerName: '', mobile: '', title: '', notes: '', status: 'OPEN' });
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
        customerName: form.customerName,
        mobile: form.mobile || undefined,
        title: form.title,
        notes: form.notes || undefined,
        status: form.status,
        capturedAt: new Date().toISOString(),
      };
      if (location) {
        payload.location = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        };
      }
      await api.post('/api/services', payload);
      setSuccess('Service added successfully!');
      setForm({ customerName: '', mobile: '', title: '', notes: '', status: 'OPEN' });
      setLocation(null);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3>Add New Service</h3>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Customer Name</label>
          <input name="customerName" value={form.customerName} onChange={handleChange} required placeholder="Customer full name" />
        </div>
        <div className="form-group">
          <label>Mobile (optional)</label>
          <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="9876543210" />
        </div>
        <div className="form-group">
          <label>Service Title</label>
          <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. AC Repair" />
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Additional details..." />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            {SERVICE_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Location</label>
          <LocationCapture onCapture={setLocation} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Service'}
        </button>
      </form>
    </div>
  );
}

export default function TechnicianDashboard() {
  const [tab, setTab] = useState('My Customers');
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

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

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const res = await api.get('/api/services');
      setServices(res.data);
    } catch {
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchServices();
  }, [fetchCustomers, fetchServices]);

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: 24 }}>
        <h1 className="page-title">Technician Dashboard</h1>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        {tab === 'My Customers' && <MyCustomers customers={customers} loading={loadingCustomers} />}
        {tab === 'Add Customer' && (
          <AddCustomer onAdded={() => { fetchCustomers(); setTab('My Customers'); }} />
        )}
        {tab === 'My Services' && <MyServices services={services} loading={loadingServices} />}
        {tab === 'Add Service' && (
          <AddService onAdded={() => { fetchServices(); setTab('My Services'); }} />
        )}
      </div>
    </>
  );
}
