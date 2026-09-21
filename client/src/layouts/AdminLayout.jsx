import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { PortalSidebar } from '../components/navigation/PortalSidebar';
import { PortalTopbar } from '../components/navigation/PortalTopbar';
import { adminNavGroups, adminProfileMenu } from '../config/navigation';

export const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('fk_admin_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('fk_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row antialiased">
      {/* 1. Left Sidebar with Permission Filtering */}
      <PortalSidebar
        portal="admin"
        title="FairKart Admin"
        subtitle="Operations & Management"
        navGroups={adminNavGroups}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      {/* 2. Main Content Area + Topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <PortalTopbar
          portal="admin"
          user={user}
          profileMenu={adminProfileMenu}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
