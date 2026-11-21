# 🍱 Meal Distribution System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless_PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Production_Ready-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A full-stack, enterprise-grade institutional catering, real-time kitchen operations, and meal delivery orchestration platform. Built with **Next.js App Router**, **Neon Serverless PostgreSQL**, and **Tailwind CSS**, the system provides role-segregated portals for **Customers**, **Kitchen Staff**, **Delivery Riders**, and **System Administrators** with strict 3NF relational data integrity, simulated financial transactions, and multi-stage lifecycle state machines.

---

## ⚡ Interactive Demo & Instant Role Switcher

The application features a floating, collapsible **Demo Role Switcher** widget in the bottom-right corner (`fixed bottom-4 right-4 z-50`). Evaluators and recruiters can switch instantly between **Customer**, **Kitchen**, **DeliveryMan**, and **Admin** accounts with **a single click**—without manually logging out or copying credentials:

* **One-Click Session Provisioning:** Automatically requests `/api/demo-switch`, sets authenticated session cookies (`role`, `userId`), and synchronizes client state.
* **Smart Route Detection:** Discretely collapses into a high-contrast pill displaying the currently active role and expands into an accessible evaluation popover card.

---

## 🌟 Role Portals & System Capabilities

| Portal | Route | Primary Capabilities |
| :--- | :--- | :--- |
| **👑 Admin Portal** | `/admin` | Global revenue analytics, total order volume, real-time user management (provisioning staff & riders), menu catalog CRUD, order history inspection, and payment reconciliation. |
| **🍳 Kitchen Dashboard** | `/kitchen` | Active cooking queue, real-time status advancement (`Pending` ➔ `Kitchen_Accepted` ➔ `Cooking_Done`), dish preparation breakdown, and live menu item management. |
| **🛵 Delivery Portal** | `/delivery` | Assigned delivery tracking, GPS street addresses, order dispatch updates (`Dispatched` ➔ `Delivered`), and Cash-on-Delivery (COD) collection settlement. |
| **🍱 Customer Hub** | `/customer` | Interactive digital menu (Regular & Premium tiers), dynamic cart, bKash / Card / Cash checkout, live status timeline, verified 5-star dish reviews, and profile address management. |

---

## 🗄️ Relational Database Architecture (3NF)

The database runs on **Neon Serverless PostgreSQL** configured with strict Third Normal Form (3NF) normalization, referential integrity, cascading foreign keys, and optimized B-tree indexes:

```
  ┌──────────────┐          ┌──────────────┐          ┌────────────────┐
  │   Customer   │──1:N────<│    Order     │>───N:1───│  DeliveryMan   │
  │  (All Users) │          │              │          │  (Customer FK) │
  └──────────────┘          └──────────────┘          └────────────────┘
         │                         │                           │
        1:N                       1:N                         1:N
         │                         │                           │
         v                         v                           v
  ┌──────────────┐          ┌──────────────┐          ┌────────────────┐
  │    Review    │          │ PLACES_ITEM  │          │ Order_History  │
  │ (Rating 1-5) │          │  (Junction)  │          │ (Audit Trail)  │
  └──────────────┘          └──────────────┘          └────────────────┘
         ^                         │                           │
        N:1                       N:1                         1:1
         │                         v                           v
  ┌──────────────┐          ┌──────────────┐          ┌────────────────┐
  │   MenuItem   │<─────────┤   MenuItem   │          │    Payment     │
  │(Price & Tier)│          │  (Catalog)   │          │(bKash/Card/COD)│
  └──────────────┘          └──────────────┘          └────────────────┘
```

### Table Schema Summary

1. **`"Customer"`** — Core user entity with role-based segregation (`Admin`, `Kitchen`, `Delivery`, `Customer`), encrypted `bcryptjs` credentials, contact info, and delivery address fields.
2. **`"MenuItem"`** — Menu catalog with name, numeric pricing (`NUMERIC(10, 2)`), image asset links, and meal tiers (`Regular`, `Premium`).
3. **`"Order"`** — Primary order header linking `CustomerID`, assigned `DeliveryManID`, total price, and unique order tracking reference (`Order_Number` format: `26-XXX`).
4. **`"PLACES_ITEM"`** — Normalized junction table resolving the many-to-many relationship between orders and menu items with itemized quantities.
5. **`"Order_History"`** — Append-only chronological audit log tracking order status progression:
   $$\text{Pending} \longrightarrow \text{Kitchen\_Accepted} \longrightarrow \text{Cooking\_Done} \longrightarrow \text{Dispatched} \longrightarrow \text{Delivered}$$
6. **`"Payment"`** — Financial transaction ledger recording payment methods (`bKash`, `Card`, `Cash On Delivery`), status (`Pending`, `Completed`), timestamps, and settled amounts.
7. **`"Review"`** — Customer feedback engine enforcing single verified reviews per order item (`UNIQUE("OrderID", "MenuItemID")`) with numerical ratings (1–5) and commentary.
8. **Compatibility Views** — `"USER"`, `"Admin"`, `"Kitchen"`, and `"DeliveryMan"` SQL views providing seamless legacy query compatibility without data duplication.

### Serverless Database Resilience
* **Connection Pooling:** Serverless connection reuse via `@neondatabase/serverless` Pool with connection pooling caps (`DB_CONNECTION_LIMIT`).
* **Dual-Casing Adapter:** Custom ORM adapter (`lib/db.js`) transparently maps lowercase native PostgreSQL fields to PascalCase properties expected by frontend components.
* **Atomic Transactions:** Checkout workflows execute inside isolated SQL transactions (`BEGIN` → `COMMIT` / `ROLLBACK`) with guaranteed connection release.

---

## 📁 Project Structure

```text
meal-distribution/
├── app/
│   ├── (auth)/
│   │   ├── login/page.js         # Dedicated login view
│   │   ├── signup/page.js        # Customer account registration
│   ├── admin/page.js             # Admin management & revenue analytics
│   ├── customer/page.js          # Customer ordering, cart & review portal
│   ├── delivery/page.js          # Delivery rider dispatch & task queue
│   ├── kitchen/page.js           # Kitchen queue & cooking state machine
│   ├── api/
│   │   ├── admin/route.js        # Admin metrics, user CRUD & order audit
│   │   ├── customer/             # Profile, orders, and review endpoints
│   │   ├── delivery/             # Rider task assignment & status updates
│   │   ├── demo-switch/route.js  # Instant one-click demo role switcher
│   │   ├── kitchen/route.js      # Kitchen order queue advancement
│   │   ├── login/route.js        # Bcrypt authentication & HTTP-only cookies
│   │   ├── logout/route.js       # Session cookie invalidation
│   │   ├── menu/route.js         # Public menu catalog & items CRUD
│   │   ├── orders/route.js       # Atomic multi-item checkout transaction
│   │   ├── reviews/route.js      # Verified customer review submission
│   │   └── setup/route.js        # Idempotent DB migration & demo seeder
│   ├── globals.css               # Tailwind CSS v4 design tokens
│   ├── layout.js                 # Global RootLayout with mounted RoleSwitcher
│   └── page.js                   # Landing page / Role-based auth gate
├── components/
│   └── RoleSwitcher.js           # Floating collapsible demo role switcher
├── lib/
│   ├── db.js                     # Neon PostgreSQL pool & casing normalizer
│   └── schema.js                 # 3NF DDL migration & comprehensive seeder
├── public/
│   └── images/                   # High-res demo food imagery
├── scripts/
│   ├── migrate.js                # CLI database schema migration script
│   └── seed-demo.js              # CLI comprehensive demo seeder
├── proxy.js                      # Next.js edge route protection & RBAC
├── .env.example                  # Environment configuration template
├── package.json                  # Dependencies & scripts
└── README.md                     # Technical documentation
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
* **Node.js**: `v20.x` or higher (tested on Node `v26.x`)
* **Package Manager**: `npm`
* **PostgreSQL Database**: Free instance from [Neon](https://console.neon.tech) (or local PostgreSQL)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/monowarhusain/meal-distribution.git
cd meal-distribution
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file by copying the template:
```bash
cp .env.example .env.local
```

Populate your Neon PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@ep-your-endpoint.region.aws.neon.tech/neondb?sslmode=require"
DB_CONNECTION_LIMIT=10
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-secure-jwt-secret-key
```

### 4. Initialize Database Schema & Demo Data
Run the comprehensive migration and seeding script:
```bash
node scripts/seed-demo.js
```
*Alternatively, visit `http://localhost:3000/api/setup` in your browser after starting the server.*

### 5. Launch the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Pre-Seeded Demo Credentials

Use the floating **Demo Role Switcher** widget for instant 1-click evaluation, or log in manually using the pre-seeded credentials:

| Role | Name | Email | Password | Assigned Portal |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin** | System Admin | `admin@meal.com` | `admin123` | `/admin` |
| **👑 Admin** | Monowar Husain Omi | `omi@bracu.edu.bd` | `admin123` | `/admin` |
| **🍳 Kitchen** | Head Chef Rahat | `kitchen@meal.com` | `kitchen123` | `/kitchen` |
| **🍳 Kitchen** | Sous Chef Tareq | `kitchen2@meal.com` | `kitchen123` | `/kitchen` |
| **🛵 Delivery** | Rider Karim | `delivery@meal.com` | `delivery123` | `/delivery` |
| **🛵 Delivery** | Rider Sumon | `delivery2@meal.com` | `delivery123` | `/delivery` |
| **🍱 Customer** | Tanvir Customer | `customer@meal.com` | `customer123` | `/customer` |
| **🍱 Customer** | Anika Tabassum | `anika@meal.com` | `customer123` | `/customer` |
| **🍱 Customer** | Farhan Ahmed | `farhan@meal.com` | `customer123` | `/customer` |

---

## 🌐 Deploying to Vercel

1. Push this repository to your GitHub account.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In **Settings ➔ Environment Variables**, add:
   * `DATABASE_URL`: Your production Neon PostgreSQL connection string.
   * `DB_CONNECTION_LIMIT`: `10`
   * `JWT_SECRET`: A secure random secret string.
4. Deploy the project.
5. Initialize the database schema and demo records by triggering the idempotent setup route:
   ```bash
   curl https://your-deployment.vercel.app/api/setup
   ```

---

## 🧪 Code Quality & Verification

The project is configured with ESLint 9 and React 19 linting standards:
```bash
npm run lint   # Passes cleanly with 0 errors and 0 warnings
npm run build  # Validates all server routes and production Turbopack bundles
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
