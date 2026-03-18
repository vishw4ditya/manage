import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const TABS = ['Overview', 'Users', 'Approvals', 'Customers', 'Services'];

function Overview({ users, customers, services }) {
  const cards = [
    { label: 'Branch Users', value: users.length, color: '#16a34a' },
    { label: 'Customers', value: customers.length, color: '#d97706' },
    { label: 'Services', value: services.length, color: '#dc2626' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ textAlign: 'center', borderTop: `4px solid ${c.color}`, marginBottom: 0 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: c.color }}>{c.value}</div>
          <div style={{ color: '#6b7280', fontWeight: 600 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ users }) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>Branch Users</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Employee ID</th><th>Mobile</th><th>Role</th><th>Status</th></tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={5} className="text-center" style={{ color: '#6b7280' }}>No users found</td></tr>
          )}
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td><code>{u.employeeId}</code></td>
              <td>{u.mobile}</td>
              <td>{u.role}</td>
              <td><span className={`badge badge-${u.status?.toLowerCase()}`}>{u.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalsTab() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users/pending');
      setPending(res.data);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/api/users/${id}/${action}`);
      setMsg(`User ${action}d successfully`);
      setTimeout(() => setMsg(''), 3000);
      fetchPending();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>Pending Approvals</h3>
      {msg && <div className="alert alert-success">{msg}</div>}
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr><th>Name</th><th>Employee ID</th><th>Mobile</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr><td colSpan={5} className="text-center" style={{ color: '#6b7280' }}>No pending approvals</td></tr>
            )}
            {pending.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td><code>{u.employeeId}</code></td>
                <td>{u.mobile}</td>
                <td>{u.role}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-success btn-sm" onClick={() => handleAction(u._id, 'approve')}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleAction(u._id, 'reject')}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CustomersTab({ customers }) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>Branch Customers</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Mobile</th><th>Added By</th><th>Date</th></tr>
        </thead>
        <tbody>
          {customers.length === 0 && (
            <tr><td colSpan={4} className="text-center" style={{ color: '#6b7280' }}>No customers found</td></tr>
          )}
          {customers.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.mobile}</td>
              <td>{c.createdByUserId?.name || '—'}</td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServicesTab({ services }) {
  const badgeClass = { OPEN: 'badge-pending', IN_PROGRESS: 'badge-approved', CLOSED: 'badge-rejected' };
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>Branch Services</h3>
      <table>
        <thead>
          <tr><th>Customer</th><th>Mobile</th><th>Title</th><th>Status</th><th>Technician</th><th>Date</th></tr>
        </thead>
        <tbody>
          {services.length === 0 && (
            <tr><td colSpan={6} className="text-center" style={{ color: '#6b7280' }}>No services found</td></tr>
          )}
          {services.map((s) => (
            <tr key={s._id}>
              <td>{s.customerName}</td>
              <td>{s.mobile || '—'}</td>
              <td>{s.title}</td>
              <td><span className={`badge ${badgeClass[s.status] || ''}`}>{s.status}</span></td>
              <td>{s.createdByUserId?.name || '—'}</td>
              <td>{new Date(s.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({ users: [], customers: [], services: [] });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [users, customers, services] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/customers'),
        api.get('/api/services'),
      ]);
      setData({ users: users.data, customers: customers.data, services: services.data });
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: 24 }}>
        <h1 className="page-title">Manager Dashboard</h1>
        {user?.branchId && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            Branch ID: <strong>{typeof user.branchId === 'object' ? user.branchId.name : user.branchId}</strong>
          </div>
        )}
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        {loading && tab === 'Overview' ? (
          <p>Loading...</p>
        ) : (
          <>
            {tab === 'Overview' && <Overview {...data} />}
            {tab === 'Users' && <UsersTab users={data.users} />}
            {tab === 'Approvals' && <ApprovalsTab />}
            {tab === 'Customers' && <CustomersTab customers={data.customers} />}
            {tab === 'Services' && <ServicesTab services={data.services} />}
          </>
        )}
      </div>
    </>
  );
}
