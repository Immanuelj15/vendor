import api from './api';

export const superAdminService = {
  // Dashboard
  getDashboardStats: async () => {
    const res = await api.get('/super-admin/dashboard');
    return res.data?.data;
  },

  // Users
  getUsers: async (params = {}) => {
    const res = await api.get('/super-admin/users', { params });
    return res.data?.data;
  },

  getUserById: async (id) => {
    const res = await api.get(`/super-admin/users/${id}`);
    return res.data?.data;
  },

  updateUser: async (id, data) => {
    const res = await api.put(`/super-admin/users/${id}`, data);
    return res.data?.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/super-admin/users/${id}`);
    return res.data?.data;
  },

  resetUserPassword: async (id, password) => {
    const res = await api.post(`/super-admin/users/${id}/reset-password`, { password });
    return res.data?.data;
  },

  // Admins
  getAdmins: async () => {
    const res = await api.get('/super-admin/admins');
    return res.data?.data?.admins || [];
  },

  createAdmin: async (data) => {
    const res = await api.post('/super-admin/admins', data);
    return res.data?.data;
  },

  updateAdmin: async (id, data) => {
    const res = await api.put(`/super-admin/admins/${id}`, data);
    return res.data?.data;
  },

  deleteAdmin: async (id) => {
    const res = await api.delete(`/super-admin/admins/${id}`);
    return res.data?.data;
  },

  resetAdminPassword: async (id, password) => {
    const res = await api.post(`/super-admin/admins/${id}/reset-password`, { password });
    return res.data?.data;
  },

  // Analytics
  getAnalytics: async () => {
    const res = await api.get('/super-admin/analytics');
    return res.data?.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/super-admin/audit-logs', { params });
    return res.data?.data;
  },

  // Settings & Maintenance
  getSettings: async () => {
    const res = await api.get('/super-admin/settings');
    return res.data?.data;
  },

  updateSettings: async (settings) => {
    const res = await api.put('/super-admin/settings', { settings });
    return res.data?.data;
  },

  toggleMaintenanceMode: async (enabled) => {
    const res = await api.post('/super-admin/settings/maintenance', { enabled });
    return res.data?.data;
  },

  // Roles Matrix
  getRolesMatrix: async () => {
    const res = await api.get('/super-admin/roles');
    return res.data?.data;
  },

  // 9-Level MLM Network
  getMLMTree: async (params = {}) => {
    const res = await api.get('/super-admin/mlm/tree', { params });
    return res.data?.data;
  },

  getMLMCommissions: async (params = {}) => {
    const res = await api.get('/super-admin/mlm/commissions', { params });
    return res.data?.data;
  },

  // Commission Rules
  getCommissionSettings: async () => {
    const res = await api.get('/super-admin/commissions/settings');
    return res.data?.data;
  },

  updateCommissionSettings: async (data) => {
    const res = await api.put('/super-admin/commissions/settings', data);
    return res.data?.data;
  },

  // Subscriptions
  getSubscriptionPlans: async () => {
    const res = await api.get('/super-admin/subscriptions/plans');
    return res.data?.data;
  },

  createSubscriptionPlan: async (data) => {
    const res = await api.post('/super-admin/subscriptions/plans', data);
    return res.data?.data;
  },

  updateSubscriptionPlan: async (id, data) => {
    const res = await api.put(`/super-admin/subscriptions/plans/${id}`, data);
    return res.data?.data;
  },

  deleteSubscriptionPlan: async (id, planType) => {
    const res = await api.delete(`/super-admin/subscriptions/plans/${id}`, { params: { planType } });
    return res.data?.data;
  },

  // Payouts / Settlements
  getPayoutRequests: async (params = {}) => {
    const res = await api.get('/super-admin/payouts', { params });
    return res.data?.data;
  },

  approvePayoutRequest: async (id, data = {}) => {
    const res = await api.post(`/super-admin/payouts/${id}/approve`, data);
    return res.data?.data;
  },

  rejectPayoutRequest: async (id, data = {}) => {
    const res = await api.post(`/super-admin/payouts/${id}/reject`, data);
    return res.data?.data;
  },

  // Financial Ledger
  getFinancialLedger: async (params = {}) => {
    const res = await api.get('/super-admin/ledger', { params });
    return res.data?.data;
  },
};

