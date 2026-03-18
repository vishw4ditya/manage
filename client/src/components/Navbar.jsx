import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardLink = () => {
    if (!user) return '/login';
    const map = {
      OWNER: '/dashboard/owner',
      REGIONAL_MANAGER: '/dashboard/rm',
      MANAGER: '/dashboard/manager',
      SALESMAN: '/dashboard/salesman',
      TECHNICIAN: '/dashboard/technician',
    };
    return map[user.role] || '/login';
  };

  return (
    <nav>
      <Link to={dashboardLink()} className="nav-brand">Manage App</Link>
      <div className="nav-links">
        {user ? (
          <>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {user.name} ({user.role})
            </span>
            <Link to={dashboardLink()}>Dashboard</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
