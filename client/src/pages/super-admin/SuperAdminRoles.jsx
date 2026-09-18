import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Shield, Check, X, Crown, RefreshCw, Lock, Sparkles } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminRoles = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await superAdminService.getRolesMatrix();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load roles matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const matrixPermissions = [
    { key: 'profile.view', label: 'View Own Profile', superAdmin: true, admin: true, vendor: true, user: true },
    { key: 'orders.create', label: 'Place & Pay Orders', superAdmin: true, admin: false, vendor: false, user: true },
    { key: 'vendor.products', label: 'Manage Vendor Products', superAdmin: true, admin: true, vendor: true, user: false },
    { key: 'vendor.finance', label: 'Vendor Payouts & Settlements', superAdmin: true, admin: true, vendor: true, user: false },
    { key: 'catalog.manage', label: 'Approve & Reject Products', superAdmin: true, admin: true, vendor: false, user: false },
    { key: 'customer.manage', label: 'Manage Users & Customers', superAdmin: true, admin: true, vendor: false, user: false },
    { key: 'admin.manage', label: 'Create & Manage Normal Admins', superAdmin: true, admin: false, vendor: false, user: false },
    { key: 'super_admin.manage', label: 'Manage Super Admins', superAdmin: true, admin: false, vendor: false, user: false },
    { key: 'settings.manage', label: 'Manage Platform & System Settings', superAdmin: true, admin: false, vendor: false, user: false },
    { key: 'maintenance.toggle', label: 'Toggle System Maintenance Mode', superAdmin: true, admin: false, vendor: false, user: false },
    { key: 'audit_logs.view', label: 'Inspect Immutable Audit Trail', superAdmin: true, admin: false, vendor: false, user: false },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" /> Access Control Matrix
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Roles & Permissions Authority</h1>
          <p className="text-xs text-slate-500">
            System-level access policies, capability boundaries, and custom role assignments.
          </p>
        </div>

        <button
          onClick={fetchRoles}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs shadow-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Permissions Matrix Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Standard Platform Roles Matrix
          </h3>
          <span className="text-[11px] text-blue-600 font-bold">Backend-Enforced Authorization</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Capability / Permission</th>
                <th className="px-4 py-3.5 text-blue-700 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-blue-600" /> SUPER_ADMIN
                  </div>
                </th>
                <th className="px-4 py-3.5 text-indigo-700 text-center">ADMIN</th>
                <th className="px-4 py-3.5 text-emerald-700 text-center">VENDOR</th>
                <th className="px-4 py-3.5 text-slate-600 text-center">CUSTOMER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixPermissions.map((item) => (
                <tr key={item.key} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {item.label}
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{item.key}</span>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    {item.superAdmin ? (
                      <span className="inline-flex p-1 rounded-full bg-blue-100 text-blue-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    {item.admin ? (
                      <span className="inline-flex p-1 rounded-full bg-indigo-100 text-indigo-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    {item.vendor ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    {item.user ? (
                      <span className="inline-flex p-1 rounded-full bg-slate-200 text-slate-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Role Descriptions Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {data?.defaultMatrix?.map((role) => (
          <motion.div
            key={role.role}
            variants={itemVariants}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                {role.displayName}
              </h4>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {role.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">{role.description}</p>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              {role.permissions?.map((p) => (
                <span
                  key={p}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/70"
                >
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminRoles;
