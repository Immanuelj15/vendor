import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { VendorLayout } from '../layouts/VendorLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';
import { AuthLayoutWrapper } from '../layouts/AuthLayoutWrapper';
import { NotFound } from '../pages/NotFound';

// Route Guards
import {
  CustomerRoute,
  VendorRoute,
  AdminRoute,
  SuperAdminRoute,
  ProtectedRoute
} from './ProtectedRoute';

// Public & Shared Pages
import { Home } from '../pages/Home';
import { Products } from '../pages/Products';
import { ProductDetail } from '../pages/ProductDetail';
import { Cart } from '../pages/Cart';
import { Checkout } from '../pages/Checkout';
import { ShopQRJoin } from '../pages/ShopQRJoin';
import ScanProcessor from '../pages/ScanProcessor';

// Auth Pages
import { Login } from '../pages/Login';
import { PortalGateway } from '../pages/PortalGateway';
import { Register } from '../pages/Register';
import { CustomerLogin } from '../pages/auth/CustomerLogin';
import { VendorLogin } from '../pages/auth/VendorLogin';
import { AdminLogin } from '../pages/auth/AdminLogin';
import { SuperAdminLogin } from '../pages/auth/SuperAdminLogin';
import { Unauthorized } from '../pages/auth/Unauthorized';

// Customer Pages
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { Orders } from '../pages/Orders';
import { OrderDetail } from '../pages/OrderDetail';
import { CustomerShop } from '../pages/CustomerShop';
import CustomerAttributionView from '../pages/CustomerAttributionView';
import { Referrals } from '../pages/Referrals';
import { Wallet } from '../pages/Wallet';
import { SpinWheel } from '../pages/SpinWheel';
import { Profile } from '../pages/Profile';
import { Addresses } from '../pages/Addresses';
import { Notifications } from '../pages/Notifications';
import { Settings } from '../pages/Settings';
import { CustomerSubscription } from '../pages/CustomerSubscription';
import { OfflineBills } from '../pages/OfflineBills';
import { Wishlist } from '../pages/Wishlist';
import { Commissions } from '../pages/Commissions';

// Vendor Pages
import { VendorDashboard } from '../pages/VendorDashboard';
import { VendorOnboarding } from '../pages/VendorOnboarding';
import { VendorProfile } from '../pages/VendorProfile';
import { VendorSubscription } from '../pages/VendorSubscription';
import { VendorSubscriptionCheckout } from '../pages/VendorSubscriptionCheckout';
import { VendorSubscriptionHistory } from '../pages/VendorSubscriptionHistory';
import { VendorNetworkDashboard } from '../pages/VendorNetworkDashboard';
import VendorProducts from '../pages/VendorProducts';
import VendorProductForm from '../pages/VendorProductForm';
import VendorQRDashboard from '../pages/VendorQRDashboard';
import VendorCustomers from '../pages/VendorCustomers';
import VendorOrders from '../pages/VendorOrders';
import VendorOrderDetail from '../pages/VendorOrderDetail';
import VendorFinance from '../pages/VendorFinance';

// Admin Pages
import { AdminDashboard } from '../pages/AdminDashboard';
import { AdminFulfillmentDashboard } from '../pages/AdminFulfillmentDashboard';
import { AdminAnalytics } from '../pages/AdminAnalytics';
import { SystemHealth } from '../pages/SystemHealth';
import { AdminEntityList } from '../components/AdminEntityList';
import { AdminVendorReview } from '../pages/AdminVendorReview';
import { AdminVendorList } from '../pages/AdminVendorList';
import { AdminSubscriptionPlans } from '../pages/AdminSubscriptionPlans';
import { AdminVendorSubscriptions } from '../pages/AdminVendorSubscriptions';
import { AdminNetworkViewer } from '../pages/AdminNetworkViewer';
import { AdminFranchiseGeography } from '../pages/AdminFranchiseGeography';
import { AdminNetworkSettings } from '../pages/AdminNetworkSettings';
import AdminProductReview from '../pages/AdminProductReview';
import { AdminShopAttributions } from '../pages/AdminShopAttributions';
import { AdminManagement } from '../pages/AdminManagement';

// Super Admin Pages
import { SuperAdminDashboard } from '../pages/super-admin/SuperAdminDashboard';
import { SuperAdminUsers } from '../pages/super-admin/SuperAdminUsers';
import { SuperAdminAdmins } from '../pages/super-admin/SuperAdminAdmins';
import { SuperAdminRoles } from '../pages/super-admin/SuperAdminRoles';
import { SuperAdminAnalytics } from '../pages/super-admin/SuperAdminAnalytics';
import { SuperAdminAuditLogs } from '../pages/super-admin/SuperAdminAuditLogs';
import { SuperAdminSettings } from '../pages/super-admin/SuperAdminSettings';
import { SuperAdminProfile } from '../pages/super-admin/SuperAdminProfile';
import { SuperAdminMLM } from '../pages/super-admin/SuperAdminMLM';
import { SuperAdminCommissions } from '../pages/super-admin/SuperAdminCommissions';
import { SuperAdminSubscriptions } from '../pages/super-admin/SuperAdminSubscriptions';
import { SuperAdminPayouts } from '../pages/super-admin/SuperAdminPayouts';
import { SuperAdminLedger } from '../pages/super-admin/SuperAdminLedger';

// Hub & Delivery Portals
import { HubDashboard } from '../pages/HubDashboard';
import { DeliveryDashboard } from '../pages/DeliveryDashboard';
import { FranchiseDashboard } from '../pages/FranchiseDashboard';
import { ShopkeeperDashboard } from '../pages/ShopkeeperDashboard';
import { ShopQRCodeManager } from '../pages/ShopQRCodeManager';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ------------------------------------------------------------- */}
      {/* 1. PUBLIC PORTAL ENTRY POINTS & COMMON AUTH (AuthLayout)       */}
      {/* ------------------------------------------------------------- */}
      <Route element={<AuthLayoutWrapper />}>
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<Register />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorOnboarding />} />
        <Route path="/vendor/apply" element={<VendorOnboarding />} />
        <Route path="/vendor/onboarding" element={<VendorOnboarding />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/portals" element={<PortalGateway />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 2. CUSTOMER PORTAL (Strictly Customer Protected)             */}
      {/* ------------------------------------------------------------- */}
      <Route
        path="/customer"
        element={
          <CustomerRoute>
            <CustomerLayout />
          </CustomerRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="coins" element={<Wallet />} />
        <Route path="rewards" element={<SpinWheel />} />
        <Route path="spin" element={<SpinWheel />} />
        <Route path="bills" element={<OfflineBills />} />
        <Route path="offline-bills" element={<OfflineBills />} />
        <Route path="subscription" element={<CustomerSubscription />} />
        <Route path="referral" element={<Referrals />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="addresses" element={<Addresses />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 3. VENDOR PORTAL (Strictly Vendor Protected & Status Gated)   */}
      {/* ------------------------------------------------------------- */}
      <Route
        path="/vendor"
        element={
          <VendorRoute>
            <VendorLayout />
          </VendorRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="products/new" element={<VendorProductForm />} />
        <Route path="products/add" element={<VendorProductForm />} />
        <Route path="products/:id/edit" element={<VendorProductForm />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="orders/:id" element={<VendorOrderDetail />} />
        <Route path="customers" element={<VendorCustomers />} />
        <Route path="sales" element={<VendorFinance />} />
        <Route path="finance" element={<VendorFinance />} />
        <Route path="analytics" element={<VendorDashboard />} />
        <Route path="wallet" element={<VendorFinance />} />
        <Route path="payouts" element={<VendorFinance />} />
        <Route path="transactions" element={<VendorFinance />} />
        <Route path="qr" element={<VendorQRDashboard />} />
        <Route path="subscription" element={<VendorSubscription />} />
        <Route path="subscription/checkout/:planId" element={<VendorSubscriptionCheckout />} />
        <Route path="subscription/history" element={<VendorSubscriptionHistory />} />
        <Route path="network" element={<VendorNetworkDashboard />} />
        <Route path="profile" element={<VendorProfile />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 4. ADMIN PORTAL (Operational Management)                      */}
      {/* ------------------------------------------------------------- */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="vendors" element={<AdminVendorList />} />
        <Route path="vendors/:id/review" element={<AdminVendorReview />} />
        <Route path="customers" element={<AdminEntityList />} />
        <Route path="users" element={<AdminEntityList />} />
        <Route path="orders" element={<AdminEntityList />} />
        <Route path="products" element={<AdminEntityList />} />
        <Route path="products/review" element={<AdminProductReview />} />
        <Route path="subscriptions" element={<AdminManagement />} />
        <Route path="vendor-subscriptions" element={<AdminVendorSubscriptions />} />
        <Route path="subscription-plans" element={<AdminSubscriptionPlans />} />
        <Route path="payments" element={<AdminEntityList />} />
        <Route path="payouts" element={<AdminEntityList />} />
        <Route path="settlements" element={<AdminEntityList />} />
        <Route path="commissions" element={<AdminEntityList />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="reports" element={<AdminAnalytics />} />
        <Route path="system-health" element={<SystemHealth />} />
        <Route path="franchises" element={<AdminManagement />} />
        <Route path="shopkeepers" element={<AdminManagement />} />
        <Route path="shops" element={<AdminManagement />} />
        <Route path="kyc" element={<AdminManagement />} />
        <Route path="shop-attributions" element={<AdminShopAttributions />} />
        <Route path="fulfillment" element={<AdminFulfillmentDashboard />} />
        <Route path="delivery" element={<AdminEntityList />} />
        <Route path="coupons" element={<AdminEntityList />} />
        <Route path="campaigns" element={<AdminEntityList />} />
        <Route path="network-viewer" element={<AdminNetworkViewer />} />
        <Route path="network-settings" element={<AdminNetworkSettings />} />
        <Route path="geography" element={<AdminFranchiseGeography />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 5. SUPER ADMIN PORTAL (Platform Owner Control Center)         */}
      {/* ------------------------------------------------------------- */}
      <Route
        path="/super-admin"
        element={
          <SuperAdminRoute>
            <SuperAdminLayout />
          </SuperAdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="customers" element={<SuperAdminUsers />} />
        <Route path="vendors" element={<SuperAdminUsers />} />
        <Route path="admins" element={<SuperAdminAdmins />} />
        <Route path="roles" element={<SuperAdminRoles />} />
        <Route path="mlm" element={<SuperAdminMLM />} />
        <Route path="network" element={<SuperAdminMLM />} />
        <Route path="commissions" element={<SuperAdminCommissions />} />
        <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
        <Route path="payouts" element={<SuperAdminPayouts />} />
        <Route path="wallets" element={<SuperAdminLedger />} />
        <Route path="ledger" element={<SuperAdminLedger />} />
        <Route path="analytics" element={<SuperAdminAnalytics />} />
        <Route path="reports" element={<SuperAdminAnalytics />} />
        <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
        <Route path="settings" element={<SuperAdminSettings />} />
        <Route path="profile" element={<SuperAdminProfile />} />
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* 6. PUBLIC STOREFRONT & SHARED ACCOUNT (MainLayout)           */}
      {/* ------------------------------------------------------------- */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="join/shop/:publicToken" element={<ShopQRJoin />} />
        <Route path="v/:token" element={<ScanProcessor />} />

        {/* Legacy / Shared Account Shortcuts for smooth user experience */}
        <Route path="account/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="account/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="account/shop" element={<ProtectedRoute><CustomerShop /></ProtectedRoute>} />
        <Route path="account/attribution" element={<ProtectedRoute><CustomerAttributionView /></ProtectedRoute>} />
        <Route path="account/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
        <Route path="account/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="account/fair-coins" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="account/spin" element={<ProtectedRoute><SpinWheel /></ProtectedRoute>} />
        <Route path="account/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="account/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
        <Route path="account/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="account/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="account/subscription" element={<ProtectedRoute><CustomerSubscription /></ProtectedRoute>} />
        <Route path="account/offline-bills" element={<ProtectedRoute><OfflineBills /></ProtectedRoute>} />
        <Route path="account/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="account/commissions" element={<ProtectedRoute><Commissions /></ProtectedRoute>} />

        {/* Support Portals */}
        <Route path="delivery/dashboard" element={<ProtectedRoute allowedRoles={['DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN']}><DeliveryDashboard /></ProtectedRoute>} />
        <Route path="hub/dashboard" element={<ProtectedRoute allowedRoles={['HUB_STAFF', 'ADMIN', 'SUPER_ADMIN']}><HubDashboard /></ProtectedRoute>} />
        <Route path="franchise/dashboard" element={<ProtectedRoute allowedRoles={['STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE', 'ADMIN', 'SUPER_ADMIN']}><FranchiseDashboard /></ProtectedRoute>} />
        <Route path="shopkeeper/dashboard" element={<ProtectedRoute allowedRoles={['SHOPKEEPER', 'ADMIN', 'SUPER_ADMIN']}><ShopkeeperDashboard /></ProtectedRoute>} />
        <Route path="shopkeeper/qr" element={<ProtectedRoute allowedRoles={['SHOPKEEPER', 'ADMIN', 'SUPER_ADMIN']}><ShopQRCodeManager /></ProtectedRoute>} />
      </Route>

      {/* 7. Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
