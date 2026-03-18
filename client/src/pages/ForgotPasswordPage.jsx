import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPasswordPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { employeeId });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.resetToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
      <div className="card">
        <h2>Forgot Password</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {result ? (
          <div>
            <div className="alert alert-success">{result.message}</div>
            {result.resetToken && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, marginBottom: 8 }}>
                  <strong>Reset Token (dev mode):</strong>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ fontSize: 12, wordBreak: 'break-all', flex: 1, background: '#f3f4f6', padding: '6px 8px', borderRadius: 4 }}>
                    {result.resetToken}
                  </code>
                  <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                    {copied ? '✅' : '📋'}
                  </button>
                </div>
              </div>
            )}
            <Link to="/reset-password" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
              Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Employee ID</label>
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                placeholder="EMP-XXXX"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending...' : 'Request Reset Token'}
            </button>
          </form>
        )}
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
