import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Filter,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await superAdminService.getAuditLogs({
        page,
        limit: pagination.limit,
        action: actionFilter,
        entity: entityFilter,
      });
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-5 h-5" />
            </span>
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit trail of all elevated administrative actions, permission mutations, and configuration adjustments.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-all w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          {error}
        </motion.div>
      )}

      {/* Filter Bar */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-slate-600 font-semibold">Filter By:</span>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        >
          <option value="">All Actions</option>
          <option value="USER_UPDATED">USER_UPDATED</option>
          <option value="USER_DELETED">USER_DELETED</option>
          <option value="USER_PASSWORD_RESET">USER_PASSWORD_RESET</option>
          <option value="SUPER_ADMIN_CREATED_ADMIN">SUPER_ADMIN_CREATED_ADMIN</option>
          <option value="ADMIN_UPDATED">ADMIN_UPDATED</option>
          <option value="ADMIN_DELETED">ADMIN_DELETED</option>
          <option value="SYSTEM_SETTINGS_UPDATED">SYSTEM_SETTINGS_UPDATED</option>
          <option value="MAINTENANCE_MODE_TOGGLED">MAINTENANCE_MODE_TOGGLED</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        >
          <option value="">All Target Entities</option>
          <option value="User">User</option>
          <option value="Settings">Settings</option>
          <option value="Vendor">Vendor</option>
          <option value="Product">Product</option>
        </select>
      </motion.div>

      {/* Audit Log Table */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Initiating Admin</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">Entity ID</th>
                <th className="px-4 py-3.5">Origin IP</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-bold border border-blue-200">
                          {log.userId?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{log.userId?.name || 'Super Admin'}</p>
                          <p className="text-[10px] text-slate-400">{log.userId?.email || 'System'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 font-mono">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 font-medium">{log.entity}</td>

                    <td className="px-4 py-3.5 font-mono text-slate-500 text-[10px]">
                      {log.entityId ? `${log.entityId.substring(0, 10)}...` : '—'}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-500 text-[10px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors border border-slate-200/60"
                        title="View Payload Diff"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} audit events)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Payload Diff Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" /> Audit Log #{selectedLog._id.slice(-6)}
                  </h3>
                  <p className="text-xs text-blue-600 font-mono mt-0.5">{selectedLog.action}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Executor</span>
                  <span className="font-semibold text-slate-800">{selectedLog.userId?.name || 'System Admin'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Entity</span>
                  <span className="font-semibold text-slate-800">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Entity ID</span>
                  <span className="font-mono text-slate-700 text-[11px]">{selectedLog.entityId || 'N/A'}</span>
                </div>
              </div>

              {/* Old vs New Values */}
              <div className="space-y-2">
                <div>
                  <span className="text-slate-600 text-xs font-semibold block mb-1">Previous State (oldValue):</span>
                  <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono overflow-x-auto">
                    {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : 'null'}
                  </pre>
                </div>

                <div>
                  <span className="text-slate-600 text-xs font-semibold block mb-1">New State (newValue):</span>
                  <pre className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 text-[11px] text-blue-900 font-mono overflow-x-auto">
                    {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : 'null'}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuperAdminAuditLogs;
