# FairKart — Multi-Vendor E-Commerce + MLM Referral + Fair Coins + Spin Wheel Platform

**FairKart** is a production-quality, full-stack MERN marketplace platform combining multi-vendor e-commerce, a multi-level MLM referral hierarchy, an immutable Fair Coins reward ledger, and an interactive Spin & Win daily wheel engine.

> **Tagline**: *Shop. Earn. Refer. Win.*

---

## 🌟 Ecosystem Architecture Overview

```
FAIRKART ECOSYSTEM
├── Multi-Vendor E-Commerce (Products, Variants, Categories, Brands, Reviews)
├── MLM Multi-Level Referral Engine (Configurable 3-Level Hierarchy & Commissions)
├── Fair Coins Reward System (Immutable Ledger, Wallet, Credits, Debits, Checkout Redemptions)
├── Spin & Win Reward Feature (Backend-weighted probability selection engine)
├── Multi-Vendor Order Fulfillment (Parent Order -> Vendor Sub-Orders)
├── Payment Abstraction Layer (Razorpay Integration & COD)
└── Multi-Role Administration (Super Admin, Admin, Vendor, User)
```

---

## 🔑 Demo Account Credentials

All pre-seeded demo accounts use password: **`Password@123`**

| Role | Email | Password | Referral Code | Coins |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@fairkart.dev` | `Password@123` | `SUPER100` | 5,000 |
| **Admin** | `manager@fairkart.dev` | `Password@123` | `ADMIN200` | 2,000 |
| **Vendor** | `vendor@fairkart.dev` | `Password@123` | `VENDOR01` | 1,500 |
| **Customer** | `user@fairkart.dev` | `Password@123` | `IMMA8294` | 500 |

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port `27017` or MongoDB Atlas URI in `server/.env`)

### Running Locally

1. **Start Backend API Server**:
   ```bash
   cd server
   npm run dev
   ```
   *Runs on `http://localhost:5000`*

2. **Start Frontend Client**:
   ```bash
   cd client
   npm run dev
   ```
   *Runs on `http://localhost:5173`*

3. **Re-seed Ecosystem Data**:
   ```bash
   cd server
   npm run seed
   ```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Redux Toolkit, React Router DOM, Tailwind CSS, Framer Motion, Lucide Icons, Recharts.
- **Backend**: Node.js, Express.js, MongoDB + Mongoose, JWT + Cookie Auth, Bcrypt, Zod, Rate Limiting, Helmet.

---

## 👑 Super Admin Setup & Architecture

The **Super Admin Module** provides supreme administrative control, real-time analytics, user & admin lifecycle management, role authority matrix, immutable audit logs, and global system configuration with maintenance mode controls.

### 1. Hierarchy & Role Isolation

```text
SUPER_ADMIN (Master authority: manages all users, admins, settings, audit logs, and maintenance)
    ↓
ADMIN (Marketplace operations: catalog approvals, reviews, order monitoring)
    ↓
VENDOR / SHOPKEEPER / FRANCHISE / DELIVERY_PARTNER / USER
```

### 2. Quick Setup Instructions

1. **Configure Environment Variables (Optional)**:
   In `server/.env`, you can customize:
   ```env
   SUPER_ADMIN_EMAIL=admin@fairkart.dev
   SUPER_ADMIN_PASSWORD=Password@123
   SUPER_ADMIN_NAME=Super Admin
   ```
2. **Seed Initial Super Admin**:
   ```bash
   cd server
   npm run seed:superadmin
   ```
3. **Start Applications**:
   - Backend: `npm run dev` in `server` (Port `5000`)
   - Frontend: `npm run dev` in `client` (Port `5173`)
4. **Access the Super Admin Portal**:
   - Login at `http://localhost:5173/login` using `admin@fairkart.dev` / `Password@123`.
   - Click the gold **Super Admin** badge in the navigation bar, or visit `http://localhost:5173/super-admin`.

### 3. Dedicated Backend API Endpoints

All endpoints are strictly protected under `authenticate` + `requireSuperAdmin`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/super-admin/dashboard` | Aggregated KPI metrics, real role distribution, recent audit log stream |
| `GET` | `/api/super-admin/users` | Paginated, searchable, and filterable user directory |
| `GET` | `/api/super-admin/users/:id` | Detailed user profile |
| `PUT` | `/api/super-admin/users/:id` | Update user roles & status with demotion safeguard |
| `DELETE` | `/api/super-admin/users/:id` | Remove user with last Super Admin deletion safeguard |
| `POST` | `/api/super-admin/users/:id/reset-password` | Secure bcrypt password reset and token revocation |
| `GET` | `/api/super-admin/admins` | List elevated admin accounts and authority profiles |
| `POST` | `/api/super-admin/admins` | Create new Admin or Super Admin account |
| `PUT` | `/api/super-admin/admins/:id` | Modify admin authority and status |
| `DELETE` | `/api/super-admin/admins/:id` | Revoke admin account with last Super Admin safeguard |
| `GET` | `/api/super-admin/analytics` | Telemetry aggregations for registrations, revenue, orders, and roles |
| `GET` | `/api/super-admin/audit-logs` | Cryptographic audit logs with payload diffs and executor tracking |
| `GET` | `/api/super-admin/settings` | Read sanitized global system parameters |
| `PUT` | `/api/super-admin/settings` | Mutate system configuration with audit logging |
| `POST` | `/api/super-admin/settings/maintenance` | Instant toggle for platform maintenance mode |
| `GET` | `/api/super-admin/roles` | Authority capability matrix and custom admin role definitions |

### 4. Security & Safeguards Enforced

- **Backend Role Verification**: Frontend state is never trusted. Every `/api/super-admin/*` route independently enforces `req.user.role === 'SUPER_ADMIN'`.
- **Last Super Admin Safeguard**: The system blocks any attempt to demote, deactivate, or delete the last remaining active Super Admin account.
- **Normal Admin Isolation**: Normal `ADMIN` accounts receive `403 Forbidden` if attempting to reach Super Admin APIs or routes.
- **Secret Redaction**: API keys, database credentials, and JWT secrets are never exposed in responses or frontend panels.
- **Maintenance Mode Bypass**: When maintenance mode is active, customers receive `503 Service Unavailable`, while Super Admins bypass the block automatically.
