import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Clock, Ban, ShieldAlert, Store, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Loading Spinner
export const RouteLoading = () => (
  <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="text-xs font-semibold text-slate-500">Authorizing access...</span>
    </div>
  </div>
);

// Generic Guard
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// 1. Customer Guard
export const CustomerRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }

  const isCustomer = user && (user.role === 'USER' || user.role === 'CUSTOMER');
  if (!isCustomer) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// 2. Vendor Guard (with Status Gatekeeper)
export const VendorRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'VENDOR' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  // If user is a vendor, check their approval status
  if (user?.role === 'VENDOR') {
    const status = user.vendor?.status || 'APPROVED';

    if (status === 'PENDING' || status === 'UNDER_REVIEW') {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-amber-200 rounded-3xl p-8 text-center shadow-xl shadow-amber-500/5"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              Pending Admin Verification
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2 mb-2">Waiting for Admin Approval</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Your merchant store application has been registered. Our operations team is currently reviewing your documents and store information. You will receive an approval email shortly.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-200/80 mb-6 text-xs text-slate-600">
              <div className="font-bold text-slate-800 mb-0.5">{user.vendor?.storeName || 'My Store'}</div>
              <div className="text-[11px] text-slate-400">Application Status: <span className="font-semibold text-amber-600">UNDER_REVIEW</span></div>
            </div>
          </motion.div>
        </div>
      );
    }

    if (status === 'REJECTED') {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-xl shadow-rose-500/5"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Ban className="w-8 h-8" />
            </div>
            <span className="px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
              Application Rejected
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2 mb-2">Vendor Store Rejected</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Your merchant application was reviewed and rejected. Please contact marketplace administration or re-apply with updated business registration.
            </p>
          </motion.div>
        </div>
      );
    }

    if (status === 'SUSPENDED' || status === 'BLOCKED') {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-slate-300 rounded-3xl p-8 text-center shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="px-3 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider">
              Merchant Suspended
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2 mb-2">Access Suspended</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              This merchant account has been suspended due to compliance or operational review. Access to orders and product management is blocked.
            </p>
          </motion.div>
        </div>
      );
    }
  }

  return children;
};

// 3. Admin Guard
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// 4. Super Admin Guard
export const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
