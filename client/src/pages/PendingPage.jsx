import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PendingPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 80 }}>
      <div className="card text-center">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2>Account Pending Approval</h2>
        <p style={{ color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
          Your account has been registered and is awaiting approval from your manager.
          You'll be able to log in once your account is approved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          <Link to="/login" className="btn btn-primary">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
