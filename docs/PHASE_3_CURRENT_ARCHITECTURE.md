# Phase 3 Current Architecture Audit — FairKart / Babu Super Market

This document describes the existing user, vendor, and role architectures, outlining how the new Franchise, Shopkeeper, Shop, Territory, KYC, and Subscription models will integrate without disrupting current structures.

---

## 1. Existing User Structure
- **Model**: `User.js`
- **Identity & Auth**: Contains essential registration and login attributes (`name`, `email`, `phone`, `passwordHash`, `role`, `status`, `refreshTokenHash`).
- **Loyalty & MLM**: Holds `fairCoinBalance`, referral relations (`referredBy`, `referralPath`, `referralCode`), and verification indicators.
- **Role Control**: Employs Mongoose enum validation utilizing `Object.values(ROLES)`.

## 2. Existing Vendor Structure
- **Model**: `Vendor.js`
- **Context**: Captures business details of product sellers (`storeName`, `slug`, `status`, `commissionRate`, `totalSales`, `balance`, `pendingBalance`).
- **Connection**: References a single `User` (`userId` is unique and indexed).
- **Separation**: Represents a seller listing products in the marketplace; distinct from physical/local territorial franchises and Shopkeepers.

## 3. Existing Role System
- **File**: `constants/roles.js` and `models/Role.js`
- **Supported Roles**: `SUPER_ADMIN`, `ADMIN`, `VENDOR`, and `USER`.
- **Role Guarding**: Standard `authenticate` and `authorize(...roles)` middlewares enforce route-level role constraints.

## 4. Existing Territorial Fields
- **Status**: The database currently has NO dedicated Territory, region, state, district, or taluk mapping models. Addresses contain unstructured text strings.

## 5. Existing Relationship Fields
- **Status**: Users are linked horizontally via referred-by pointers (`referredBy`, `referralPath`). There is no multi-level hierarchical structure mapping territories, franchises, and shops.

## 6. What Must Be Added
- **Roles**: Expose `STATE_FRANCHISE`, `DISTRICT_FRANCHISE`, `TALUK_FRANCHISE`, and `SHOPKEEPER` in `roles.js` and `Role.js`.
- **Territory Model**: Map hierarchical state, district, and taluk relationships.
- **Franchise Model**: Define attributes for regional representatives with validation for territorial bounds.
- **Shopkeeper Model**: Connect users to Taluk franchises.
- **Shop Model**: Represent physical business entities with unique shop codes and geographical pointers.
- **KYC & Subscription Models**: Internal workflows for document verification and annual plan renewals.

## 7. What Should Remain Unchanged
- Core authentication pipelines (`authService.js`, tokens, session rotators).
- Existing marketplace `Vendor` flow (creating products, split-order commissions, withdraw balances).
- Parent `Order` and `Payment` architectures.
