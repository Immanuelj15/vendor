# FairKart Database Backup & Disaster Recovery Guide

## 1. Overview
This document outlines the backup, restoration, verification, and disaster recovery procedures for the FairKart Multi-Vendor E-Commerce Platform. All financial and transactional tables are preserved with full BSON/EJSON fidelity, ensuring that immutable ledgers, wallets, commissions, and double-entry transaction histories remain balanced following a restoration drill.

---

## 2. Environment Variables & Prerequisites
The backup and recovery utilities consume the following environment variables (configured via `.env` or CI/CD secrets):

| Variable | Description | Example (Development) | Production Target |
| :--- | :--- | :--- | :--- |
| `MONGO_URI` | Connection URI to the active MongoDB instance | `mongodb://127.0.0.1:27017/fairkart` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/fairkart` |
| `MFA_ENCRYPTION_KEY` | 32-byte AES-256 key for TOTP secrets at rest | *(configured in production)* | *(configured in production)* |
| `JWT_SECRET` | Primary signing key for authentication tokens | *(configured in production)* | *(configured in production)* |

---

## 3. Automated Backup Procedure

### Command:
```bash
cd server
node scripts/backupDatabase.js
```

### What It Does:
1. Connects to the active MongoDB database defined by `MONGO_URI`.
2. Inspects all registered collections (including orders, ledgers, wallets, MLM trees, and audit logs).
3. Dumps each collection into formatted JSON/BSON files preserving ObjectIds, timestamps, and decimal precision.
4. Exports index definitions for every collection into companion `.indexes.json` files.
5. Emits a `manifest.json` containing collection metadata, document counts, and checksums.
6. Saves the backup archive in `server/backups/fairkart_backup_<timestamp>/`.

---

## 4. Isolated Restoration Drill (Testing Environment)

> [!CAUTION]
> Never restore directly over the active production/development database. Always verify backups in an isolated database name (e.g. `FairKart_Restore_Test`).

### Command:
```bash
cd server
node scripts/restoreDatabase.js
```

### What It Does:
1. Locates the latest backup archive in `server/backups/` (or accepts an explicit backup directory argument).
2. Connects to the isolated target database `mongodb://127.0.0.1:27017/FairKart_Restore_Test`.
3. Purges existing collections in the isolated test database to prevent state collision.
4. Restores all documents and reconstructs unique, compound, and TTL indexes.

---

## 5. Verification & Parity Testing
After any restoration drill, run the automated validation suite:

```bash
cd server
node scripts/validateRestore.js
```

### Verifications Conducted:
- **Collection Completeness**: Confirms existence of all 18 core business collections.
- **Document Count Parity**: Confirms zero data loss across users, orders, products, and ledgers.
- **Index Integrity**: Validates `unique` constraints on `User.email`, `Order.orderNumber`, etc.
- **Financial Balance Reconciliation**:
  - Wallets vs `WalletTransactions` (0 mismatches)
  - Vendors vs `VendorLedger` (0 mismatches)
  - Platform Ledger running sum vs balance snapshot
- **Multi-Role Authentication**: Confirms password hashes and roles for `SUPER_ADMIN`, `ADMIN`, `VENDOR`, and `CUSTOMER`.
- **Entity Traversal**: Verifies parent orders resolve child `VendorOrders` and MLM commissions remain queryable.

---

## 6. Daily Financial Reconciliation Runbook
Run the daily financial reconciliation script to detect any balance drift:

```bash
cd server
node scripts/reconcileFinancials.js
```

**Expected Exit Code**: `0`  
**Expected Result**: `0 MISMATCHES` across all 7 financial modules.

---

## 7. Emergency Disaster Recovery (Production Outage)

In the event of physical host loss or database corruption:

1. **Provision New MongoDB Instance / Atlas Cluster**:
   - Obtain new connection URI: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/fairkart_prod`.
2. **Execute Full Restore**:
   ```bash
   node scripts/restoreDatabase.js <path-to-latest-backup> fairkart_prod
   ```
3. **Verify Integrity**:
   - Update staging environment to point to `fairkart_prod`.
   - Run `node scripts/validateRestore.js`.
4. **Switch Traffic**:
   - Update production environment variable `MONGO_URI` to point to the restored cluster.
   - Restart API microservices.
   - Verify health endpoint: `GET /api/health`.

---

## 8. Rollback Procedure
If a deployment introduces corrupt financial state:
1. Switch API to maintenance mode (`MAINTENANCE_MODE=true`).
2. Run `scripts/restoreDatabase.js` pointing to the pre-deployment backup directory.
3. Validate parity using `scripts/validateRestore.js` and `scripts/reconcileFinancials.js`.
4. Deactivate maintenance mode.
