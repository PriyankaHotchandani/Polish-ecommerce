# PROJECT_ARCHITECTURE: BM SP. Z O.O. E-commerce Platform

## 1. Project Overview
**Goal:** Build a highly scalable, bespoke headless e-commerce platform for BM SP. Z O.O., a major Polish retail and wholesale business specializing in household items, tools, and equipment. 
**Objective:** Transition the company's primary digital footprint away from third-party marketplaces to a fully independent, direct-to-consumer (DTC) and business-to-business (B2B) owned platform.
**Tech Stack:** - Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS.
- Internationalization: `next-intl` (Build in English first, translate to Polish later).
- Backend/Database: Supabase (PostgreSQL), Supabase Auth.
- State Management/Data Fetching: React Query or native Next.js caching.

## 2. Business Logic & Market Positioning
The platform must cater to two distinct customer bases under one unified brand experience.

- **Dual Pricing Engine:** - **B2C (Retail):** Standard consumers must see prices inclusive of VAT (Cena Brutto).
  - **B2B (Wholesale):** Authenticated business users/contractors must see net pricing (Cena Netto) and have access to bulk ordering matrices and automatic tax invoice generation.
- **Language & Localization Strategy:** - The codebase and initial UI strings will be written entirely in English.
  - All UI text must be abstracted using `next-intl` (or similar i18n routing) so a Polish translation dictionary can be easily plugged in before launch.
- **Catalog Taxonomy:** The inventory is massive and split into two primary branches. The database and UI must handle deep categorization:
  - Branch A: Household Products (e.g., kitchenware, cleaning supplies, home organization).
  - Branch B: Tools & Equipment (e.g., hand tools, power tools, hardware).

## 3. Core Website Structure
The frontend will consist of the following primary routes:
- `/` - **Home:** Dual-entry portals for Household vs. Tools, featured products.
- `/shop` - **E-commerce Hub:** High-density product grids, advanced faceted filtering (price, brand, specifications).
- `/product/[slug]` - **Product Detail Pages (PDP):** High-res galleries, dynamic B2C/B2B pricing based on auth state, and technical specifications.
- `/b2b` - **Wholesale Portal:** Gated login area for B2B clients.
- `/about` - **Brand Story:** Founder's vision, company heritage, and corporate accountability.

## 4. Database Schema (Supabase / PostgreSQL)
The relational database must be optimized for fast read-heavy operations, complex filtering, and flexible product specifications.

**Core Tables:**
1. `Users` (Extends Supabase Auth):
   - id (UUID, PK)
   - role (Enum: 'admin', 'b2c_customer', 'b2b_customer')
   - company_name (String, Nullable)
   - nip_number (String, Nullable - Polish Tax ID)
2. `Categories`:
   - id (UUID, PK)
   - name (String)
   - slug (String, Unique)
   - parent_id (UUID, FK to Categories, Nullable for sub-categories)
3. `Products`:
   - id (UUID, PK)
   - sku (String, Unique)
   - title (String)
   - slug (String, Unique)
   - brand (String, Nullable)
   - description (Text)
   - price_retail (Decimal - B2C)
   - price_wholesale (Decimal - B2B)
   - inventory_count (Integer)
   - category_id (UUID, FK to Categories)
   - specifications (JSONB - for flexible data like wattage, dimensions, material)
   - image_urls (Array of Strings)
4. `Orders`:
   - id (UUID, PK)
   - user_id (UUID, FK to Users)
   - status (Enum: 'pending', 'processing', 'shipped', 'delivered')
   - total_amount (Decimal)
   - is_b2b_invoice_required (Boolean)
5. `Order_Items`:
   - id (UUID, PK)
   - order_id (UUID, FK to Orders)
   - product_id (UUID, FK to Products)
   - quantity (Integer)
   - price_at_purchase (Decimal)

## 5. Development Directives for AI Assistant
- **Strict Typing:** All components and database calls must use strict TypeScript interfaces. 
- **Component Design:** Prefer server components by default. Only use client components (`"use client"`) when interactivity is strictly required.
- **i18n Readiness:** Never hardcode user-facing text. Always wrap text in translation functions (e.g., `t('product.buy_now')`).