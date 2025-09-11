import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import '../../styles/AdminDashboard.css';

interface AdminUser {
  email: string;
  name: string;
  role: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    // For testing - set mock user if no auth
    if (!token || !userData) {
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
      };
      setUser(mockUser);
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{sidebarCollapsed ? 'W' : 'Wedding Admin'}</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">▢</span>
            {!sidebarCollapsed && <span className="nav-text">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/admin/guests"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">◉</span>
            {!sidebarCollapsed && <span className="nav-text">Guest List</span>}
          </NavLink>

          <NavLink
            to="/admin/bulk"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">▣</span>
            {!sidebarCollapsed && <span className="nav-text">Bulk Operations</span>}
          </NavLink>

          <NavLink
            to="/admin/export"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">↓</span>
            {!sidebarCollapsed && <span className="nav-text">Export Data</span>}
          </NavLink>

          {user.role === 'SUPER_ADMIN' && (
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙</span>
              {!sidebarCollapsed && <span className="nav-text">Settings</span>}
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-icon">◉</span>
            {!sidebarCollapsed && (
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout} title="Logout">
            <span className="nav-icon">↪</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
