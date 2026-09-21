import {
  Home,
  ShoppingBag,
  Crown,
  Dices,
  Share2,
  Package,
  Heart,
  User,
  MapPin,
  Coins,
  Settings,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Boxes,
  RotateCcw,
  Users,
  TrendingUp,
  Receipt,
  ArrowDownCircle,
  Building2,
  Landmark,
  CreditCard,
  Network,
  Tag,
  Bell,
  CheckSquare,
  BarChart3,
  Shield,
  ShieldCheck,
  KeyRound,
  Sliders,
  History,
  ShieldAlert,
  Activity,
  Percent,
} from 'lucide-react';

/* ==========================================================================
   1. CUSTOMER NAVIGATION
   Pure e-commerce marketplace navigation.
   ========================================================================== */

export const customerNavItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Catalog', path: '/products', icon: ShoppingBag },
  { name: 'VIP Pass', path: '/account/subscription', icon: Crown, highlight: true },
  { name: 'Spin & Win', path: '/account/spin', icon: Dices },
  { name: 'Referral Network', path: '/account/referrals', icon: Share2 },
];

export const customerMobileBottomNav = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Catalog', path: '/products', icon: ShoppingBag },
  { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'Orders', path: '/account/orders', icon: Package },
  { name: 'Account', path: '/account/profile', icon: User },
];

export const customerDrawerSecondaryItems = [
  { name: 'Customer Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'VIP Pass', path: '/account/subscription', icon: Crown },
  { name: 'Spin & Win', path: '/account/spin', icon: Dices },
  { name: 'Referral Network', path: '/account/referrals', icon: Share2 },
  { name: 'Offline Bills', path: '/account/offline-bills', icon: Receipt },
  { name: 'Wishlist', path: '/account/wishlist', icon: Heart },
  { name: 'Settings', path: '/account/settings', icon: Settings },
  { name: 'Help & Support', path: '/account/notifications', icon: HelpCircle },
];

export const customerProfileMenu = [
  { name: 'Customer Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', path: '/account/profile', icon: User },
  { name: 'My Orders', path: '/account/orders', icon: Package },
  { name: 'My Addresses', path: '/account/addresses', icon: MapPin },
  { name: 'My Wishlist', path: '/account/wishlist', icon: Heart },
  { name: 'My Rewards & Coins', path: '/account/wallet', icon: Coins },
  { name: 'Referral Network', path: '/account/referrals', icon: Share2 },
  { name: 'Settings', path: '/account/settings', icon: Settings },
];

/* ==========================================================================
   2. VENDOR PORTAL NAVIGATION (Sidebar)
   Operational management for merchants.
   ========================================================================== */

export const vendorNavGroups = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'PRODUCT MANAGEMENT',
    items: [
      { name: 'Products', path: '/vendor/products', icon: Package },
      { name: 'Add Product', path: '/vendor/products/new', icon: PlusCircle },
      { name: 'Inventory', path: '/vendor/products', icon: Boxes },
    ],
  },
  {
    group: 'ORDER MANAGEMENT',
    items: [
      { name: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
      { name: 'Returns & Cancellations', path: '/vendor/orders', icon: RotateCcw },
    ],
  },
  {
    group: 'CUSTOMER',
    items: [
      { name: 'Customers', path: '/vendor/customers', icon: Users },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      { name: 'Earnings & Ledger', path: '/vendor/finance', icon: TrendingUp },
      { name: 'Settlements & Payouts', path: '/vendor/payouts', icon: ArrowDownCircle },
    ],
  },
  {
    group: 'VERIFICATION',
    items: [
      { name: 'Business Profile', path: '/vendor/profile', icon: Building2 },
      { name: 'Bank Details', path: '/vendor/profile', icon: Landmark },
    ],
  },
  {
    group: 'GROWTH',
    items: [
      { name: 'Subscription', path: '/vendor/subscription', icon: CreditCard },
      { name: 'Referral / MLM', path: '/vendor/network', icon: Network },
      { name: 'Store QR Codes', path: '/vendor/qr', icon: Tag },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/vendor/profile', icon: Settings },
      { name: 'Help', path: '/vendor/dashboard', icon: HelpCircle },
    ],
  },
];

export const vendorProfileMenu = [
  { name: 'Business Profile', path: '/vendor/profile', icon: Building2 },
  { name: 'Bank Details', path: '/vendor/profile', icon: Landmark },
  { name: 'Account Settings', path: '/vendor/profile', icon: Settings },
];

/* ==========================================================================
   3. ADMIN PORTAL NAVIGATION (Sidebar)
   Operational management with permission-based filtering.
   ========================================================================== */

export const adminNavGroups = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'USER MANAGEMENT',
    items: [
      { name: 'Customers', path: '/admin/users', icon: Users, permission: 'users.view' },
      { name: 'Vendors', path: '/admin/vendors', icon: Building2, permission: 'vendors.view' },
      { name: 'Admins', path: '/admin/users?role=ADMIN', icon: Shield, permission: 'admins.view' },
    ],
  },
  {
    group: 'MARKETPLACE',
    items: [
      { name: 'Products', path: '/admin/products', icon: Package, permission: 'products.view' },
      { name: 'Product Approvals', path: '/admin/products/review', icon: CheckSquare, permission: 'products.approve' },
      { name: 'Orders', path: '/admin/orders', icon: ShoppingBag, permission: 'orders.view' },
      { name: 'Fulfillment', path: '/admin/fulfillment', icon: Boxes, permission: 'fulfillment.manage' },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { name: 'Vendor Reviews', path: '/admin/vendors', icon: ShieldCheck, permission: 'vendors.approve' },
      { name: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard, permission: 'subscriptions.view' },
      { name: 'Franchises & Geography', path: '/admin/geography', icon: Network, permission: 'franchises.manage' },
    ],
  },
  {
    group: 'FINANCE & PAYOUTS',
    items: [
      { name: 'Payments', path: '/admin/payments', icon: CreditCard, permission: 'finance.view' },
      { name: 'Settlements', path: '/admin/settlements', icon: ArrowDownCircle, permission: 'settlements.view' },
      { name: 'Commissions', path: '/admin/commissions', icon: Percent, permission: 'commissions.view' },
    ],
  },
  {
    group: 'REPORTING',
    items: [
      { name: 'Sales Reports', path: '/admin/analytics', icon: BarChart3, permission: 'reports.view' },
      { name: 'System Health', path: '/admin/system-health', icon: Activity, permission: 'system.health' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Settings', path: '/admin/network-settings', icon: Settings, permission: 'settings.manage' },
      { name: 'Profile', path: '/account/profile', icon: User },
    ],
  },
];

export const adminProfileMenu = [
  { name: 'Admin Profile', path: '/account/profile', icon: User },
  { name: 'System Settings', path: '/admin/network-settings', icon: Settings },
];

/* ==========================================================================
   4. SUPER ADMIN PORTAL NAVIGATION (Sidebar)
   Platform owner command center & privileged controls.
   ========================================================================== */

export const superAdminNavGroups = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Overview Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'USER MANAGEMENT',
    items: [
      { name: 'Users & Customers', path: '/super-admin/users', icon: Users },
      { name: 'Admins & Operators', path: '/super-admin/admins', icon: ShieldCheck },
      { name: 'Roles & Permissions', path: '/super-admin/roles', icon: KeyRound },
    ],
  },
  {
    group: 'MARKETPLACE',
    items: [
      { name: 'Products Catalog', path: '/admin/products', icon: Package },
      { name: 'Orders Ledger', path: '/admin/orders', icon: ShoppingBag },
    ],
  },
  {
    group: 'FINANCE & SETTLEMENTS',
    items: [
      { name: 'Financial Ledger', path: '/super-admin/ledger', icon: Receipt },
      { name: 'Vendor Payouts', path: '/super-admin/payouts', icon: ArrowDownCircle },
      { name: 'Platform Commissions', path: '/super-admin/commissions', icon: Percent },
      { name: 'Subscription Plans', path: '/super-admin/subscriptions', icon: CreditCard },
    ],
  },
  {
    group: 'REFERRAL / MLM',
    items: [
      { name: '9-Level MLM Tree', path: '/super-admin/mlm', icon: Network },
      { name: 'Commission Rules', path: '/super-admin/commissions', icon: Sliders },
    ],
  },
  {
    group: 'PLATFORM CONFIGURATION',
    items: [
      { name: 'Platform Settings', path: '/super-admin/settings', icon: Sliders },
    ],
  },
  {
    group: 'SECURITY & AUDIT',
    items: [
      { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: History },
      { name: 'Security & Access', path: '/super-admin/roles', icon: ShieldAlert },
    ],
  },
  {
    group: 'SYSTEM & HEALTH',
    items: [
      { name: 'Analytics & Trends', path: '/super-admin/analytics', icon: BarChart3 },
      { name: 'System Health', path: '/admin/system-health', icon: Activity },
    ],
  },
  {
    group: 'ACCOUNT',
    items: [
      { name: 'Super Admin Profile', path: '/super-admin/profile', icon: User },
    ],
  },
];

export const superAdminProfileMenu = [
  { name: 'Super Admin Profile', path: '/super-admin/profile', icon: User },
  { name: 'Security & MFA', path: '/super-admin/roles', icon: ShieldAlert },
  { name: 'System Settings', path: '/super-admin/settings', icon: Settings },
];
