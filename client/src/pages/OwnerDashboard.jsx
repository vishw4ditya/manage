import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

const TABS = ['Overview', 'Users', 'Zones', 'Branches', 'Approvals', 'Customers', 'Services'];

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 480, maxHeight: '80vh', overflowY: 'auto', margin: 0 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview({ zones, branches, users, customers, services }) {
  const cards = [
    { label: 'Zones', value: zones.length, color: '#4f46e5' },
    { label: 'Branches', value: branches.length, color: '#0891b2' },
    { label: 'Users', value: users.length, color: '#16a34a' },
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

// ─── Users ───────────────────────────────────────────────────────────────────
function UsersTab({ users }) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>All Users</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Employee ID</th><th>Mobile</th><th>Role</th><th>Zone</th><th>Branch</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={7} className="text-center" style={{ color: '#6b7280' }}>No users found</td></tr>
          )}
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td><code>{u.employeeId}</code></td>
              <td>{u.mobile}</td>
              <td>{u.role}</td>
              <td>{u.zoneId?.name || '—'}</td>
              <td>{u.branchId?.name || '—'}</td>
              <td>
                <span className={`badge badge-${u.status?.toLowerCase()}`}>{u.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Zones ───────────────────────────────────────────────────────────────────
function ZonesTab({ zones, users, onRefresh }) {
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', zone?: {} }
  const [form, setForm] = useState({ name: '', rmUserId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const rmUsers = users.filter((u) => u.role === 'REGIONAL_MANAGER');

  const openAdd = () => { setForm({ name: '', rmUserId: '' }); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (z) => {
    setForm({ name: z.name, rmUserId: z.rmUserId?._id || '' });
    setError('');
    setModal({ mode: 'edit', zone: z });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim() };
      if (form.rmUserId) payload.rmUserId = form.rmUserId;
      if (modal.mode === 'add') {
        await api.post('/api/zones', payload);
      } else {
        await api.put(`/api/zones/${modal.zone._id}`, payload);
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this zone?')) return;
    try {
      await api.delete(`/api/zones/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Zones</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Zone</button>
      </div>
      <table>
        <thead>
          <tr><th>Name</th><th>Regional Manager</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {zones.length === 0 && (
            <tr><td colSpan={3} className="text-center" style={{ color: '#6b7280' }}>No zones yet</td></tr>
          )}
          {zones.map((z) => (
            <tr key={z._id}>
              <td>{z.name}</td>
              <td>{z.rmUserId ? `${z.rmUserId.name} (${z.rmUserId.employeeId})` : '—'}</td>
              <td>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(z)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(z._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Zone' : 'Edit Zone'} onClose={() => setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Zone Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. North Zone" />
          </div>
          <div className="form-group">
            <label>Regional Manager (optional)</label>
            <select value={form.rmUserId} onChange={(e) => setForm((f) => ({ ...f, rmUserId: e.target.value }))}>
              <option value="">— None —</option>
              {rmUsers.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.employeeId})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Branches ────────────────────────────────────────────────────────────────
function BranchesTab({ branches, zones, users, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', zoneId: '', managerUserId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const managerUsers = users.filter((u) => u.role === 'MANAGER');

  const openAdd = () => { setForm({ name: '', zoneId: '', managerUserId: '' }); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (b) => {
    setForm({ name: b.name, zoneId: b.zoneId?._id || '', managerUserId: b.managerUserId?._id || '' });
    setError('');
    setModal({ mode: 'edit', branch: b });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.zoneId) { setError('Name and Zone are required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: form.name.trim(), zoneId: form.zoneId };
      if (form.managerUserId) payload.managerUserId = form.managerUserId;
      if (modal.mode === 'add') {
        await api.post('/api/branches', payload);
      } else {
        await api.put(`/api/branches/${modal.branch._id}`, payload);
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this branch?')) return;
    try {
      await api.delete(`/api/branches/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Branches</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Branch</button>
      </div>
      <table>
        <thead>
          <tr><th>Name</th><th>Zone</th><th>Manager</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {branches.length === 0 && (
            <tr><td colSpan={4} className="text-center" style={{ color: '#6b7280' }}>No branches yet</td></tr>
          )}
          {branches.map((b) => (
            <tr key={b._id}>
              <td>{b.name}</td>
              <td>{b.zoneId?.name || '—'}</td>
              <td>{b.managerUserId ? `${b.managerUserId.name} (${b.managerUserId.employeeId})` : '—'}</td>
              <td>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Branch' : 'Edit Branch'} onClose={() => setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Branch Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Downtown Branch" />
          </div>
          <div className="form-group">
            <label>Zone</label>
            <select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))}>
              <option value="">Select zone</option>
              {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Manager (optional)</label>
            <select value={form.managerUserId} onChange={(e) => setForm((f) => ({ ...f, managerUserId: e.target.value }))}>
              <option value="">— None —</option>
              {managerUsers.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.employeeId})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Approvals ───────────────────────────────────────────────────────────────
function ApprovalsTab({ onApprovalChange }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

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
      setActionMsg(`User ${action}d successfully`);
      setTimeout(() => setActionMsg(''), 3000);
      fetchPending();
      onApprovalChange();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>Pending Approvals</h3>
      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr><th>Name</th><th>Employee ID</th><th>Mobile</th><th>Role</th><th>Zone</th><th>Branch</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr><td colSpan={7} className="text-center" style={{ color: '#6b7280' }}>No pending approvals</td></tr>
            )}
            {pending.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td><code>{u.employeeId}</code></td>
                <td>{u.mobile}</td>
                <td>{u.role}</td>
                <td>{u.zoneId?.name || '—'}</td>
                <td>{u.branchId?.name || '—'}</td>
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

// ─── Customers ───────────────────────────────────────────────────────────────
function CustomersTab({ customers }) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>All Customers</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Mobile</th><th>Zone</th><th>Branch</th><th>Added By</th><th>Date</th></tr>
        </thead>
        <tbody>
          {customers.length === 0 && (
            <tr><td colSpan={6} className="text-center" style={{ color: '#6b7280' }}>No customers found</td></tr>
          )}
          {customers.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.mobile}</td>
              <td>{c.zoneId?.name || '—'}</td>
              <td>{c.branchId?.name || '—'}</td>
              <td>{c.createdByUserId?.name || '—'}</td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────
function ServicesTab({ services }) {
  const badgeClass = { OPEN: 'badge-pending', IN_PROGRESS: 'badge-approved', CLOSED: 'badge-rejected' };
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>All Services</h3>
      <table>
        <thead>
          <tr><th>Customer</th><th>Mobile</th><th>Title</th><th>Status</th><th>Zone</th><th>Branch</th><th>Technician</th><th>Date</th></tr>
        </thead>
        <tbody>
          {services.length === 0 && (
            <tr><td colSpan={8} className="text-center" style={{ color: '#6b7280' }}>No services found</td></tr>
          )}
          {services.map((s) => (
            <tr key={s._id}>
              <td>{s.customerName}</td>
              <td>{s.mobile || '—'}</td>
              <td>{s.title}</td>
              <td><span className={`badge ${badgeClass[s.status] || ''}`}>{s.status}</span></td>
              <td>{s.zoneId?.name || '—'}</td>
              <td>{s.branchId?.name || '—'}</td>
              <td>{s.createdByUserId?.name || '—'}</td>
              <td>{new Date(s.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({ zones: [], branches: [], users: [], customers: [], services: [] });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [zones, branches, users, customers, services] = await Promise.all([
        api.get('/api/zones'),
        api.get('/api/branches'),
        api.get('/api/users'),
        api.get('/api/customers'),
        api.get('/api/services'),
      ]);
      setData({
        zones: zones.data,
        branches: branches.data,
        users: users.data,
        customers: customers.data,
        services: services.data,
      });
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
        <h1 className="page-title">Owner Dashboard</h1>
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
            {tab === 'Zones' && <ZonesTab zones={data.zones} users={data.users} onRefresh={fetchAll} />}
            {tab === 'Branches' && <BranchesTab branches={data.branches} zones={data.zones} users={data.users} onRefresh={fetchAll} />}
            {tab === 'Approvals' && <ApprovalsTab onApprovalChange={fetchAll} />}
            {tab === 'Customers' && <CustomersTab customers={data.customers} />}
            {tab === 'Services' && <ServicesTab services={data.services} />}
          </>
        )}
      </div>
    </>
  );
}
