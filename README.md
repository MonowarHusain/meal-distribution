# 🍱 Meal Distribution System

A full-stack Next.js production-grade meal distribution and order management system featuring multi-role authentication (**Admin**, **Kitchen**, **Delivery**, and **Customer**), real-time order tracking, payment processing, menu management, and interactive customer reviews.

Built for zero-error serverless deployment on **Vercel** with hardened MySQL connection pooling for managed databases like **Aiven MySQL** or **TiDB Cloud**.

---

## 🌟 Key Features & Role Portals

| Role | Portal Route | Primary Capabilities |
| :--- | :--- | :--- |
| **👑 Admin** | `/admin` | Global revenue analytics, order oversight, user management, staff creation, payment status approval |
| **🍳 Kitchen** | `/kitchen` | Real-time cooking queue, status advancement (`Pending` ➔ `Kitchen_Accepted` ➔ `Cooking_Done`), dynamic menu CRUD |
| **🛵 Delivery** | `/delivery` | Dispatch queue, GPS address routing, delivery assignment, cash-on-delivery collection confirmation |
| **🍱 Customer** | `/customer` | Interactive digital menu, smart cart, bKash/Card/Cash checkout, order history timeline, 5-star dish reviews |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20+ (tested with v26)
- **MySQL Database**: Local MySQL, [Aiven](https://aiven.io), or [TiDB Cloud](https://tidbcloud.com)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/monowarhusain/meal-distribution.git
cd meal-distribution
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your database connection string or individual credentials.

### 4. Initialize Database Schema & Demo Seed Data
Run the idempotent migration CLI:
```bash
node scripts/migrate.js
```
*(Or launch the development server and visit `http://localhost:3000/api/setup` in your browser)*

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to log in.

---

## 🔐 Pre-Seeded Demo Credentials

All test accounts are automatically provisioned when running `node scripts/migrate.js` or hitting `/api/setup`:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@meal.com` | `admin123` |
| **System Admin (Legacy)** | `omi@bracu.edu.bd` | `hashedpass` |
| **Head Chef (Kitchen)** | `kitchen@meal.com` | `kitchen123` |
| **Rider Karim (Delivery)** | `delivery@meal.com` | `delivery123` |
| **Tanvir (Customer)** | `customer@meal.com` | `customer123` |

---

## 🗄️ Database Architecture & Cloud Resilience

The system operates on an 8-table relational schema with full foreign-key constraints, cascading deletes, and performance indexes:
- `Customer` (Users, address data, role-based access control)
- `MenuItem` (Food catalog, pricing, item category)
- `Order` (Unique order numbering `26-XXX`, customer link, delivery rider link)
- `PLACES_ITEM` (Order line-items bridge)
- `Order_History` (Audit trail of status transitions)
- `Payment` (bKash, Card, or Cash on Delivery settlement state)
- `Review` (Dish ratings and customer feedback)
- `USER` (Compatibility view for schema aliases)

### Cloud MySQL Support (Aiven & TiDB Cloud)
- **Automatic SSL Handshake**: `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=false` enable seamless SSL communication with managed providers without needing custom root CA filesystem bindings.
- **Serverless Pool Management**: Global connection pooling with connection caps (`DB_CONNECTION_LIMIT=10`), keepalive timers, and idle timeouts prevent serverless function exhaustion.
- **Fail-Safe Transactions**: Multi-table checkouts use transactions with guaranteed rollback and safe connection releases in `finally` blocks.

---

## 🌐 Deploying to Vercel

### Step 1: Push Repository to GitHub
Ensure all changes are committed and pushed to your remote repository.

### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your repository.
3. Keep the default build command (`next build`) and output directory (`.next`).

### Step 3: Configure Environment Variables in Vercel
Add the following variables in the **Environment Variables** panel:

```ini
DATABASE_URL=mysql://username:password@hostname:port/dbname?ssl-mode=REQUIRED
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_CONNECTION_LIMIT=10
JWT_SECRET=your-production-secret-key
```

### Step 4: Run Initial Database Setup
Once deployed, initialize the remote database schema and demo seed data by making a single GET request:
```bash
curl https://your-deployment.vercel.app/api/setup
```
You will receive `{ "success": true, "message": "Database ready! ..." }`.

You can now log in immediately with the pre-seeded demo accounts!

---

## 🛠️ Verification & Linting

Run automated checks:
```bash
npm run lint   # Passes cleanly with 0 errors and 0 warnings
npm run build  # Builds production Turbopack bundles cleanly
```
