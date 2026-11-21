# 🍱 Meal Distribution System (Neon Serverless PostgreSQL Edition)

A full-stack Next.js production-grade meal distribution and order management system featuring multi-role authentication (**Admin**, **Kitchen**, **Delivery**, and **Customer**), real-time order tracking, payment processing, menu management, and interactive customer reviews.

Engineered for zero-error serverless deployment on **Vercel** powered by **Neon Serverless PostgreSQL** with `@neondatabase/serverless`.

---

## 🌟 Role Portals

| Role | Portal Route | Primary Capabilities |
| :--- | :--- | :--- |
| **👑 Admin** | `/admin` | Global revenue analytics, order oversight, user management, staff creation, payment status approval |
| **🍳 Kitchen** | `/kitchen` | Real-time cooking queue, status advancement (`Pending` ➔ `Kitchen_Accepted` ➔ `Cooking_Done`), dynamic menu CRUD |
| **🛵 Delivery** | `/delivery` | Dispatch queue, GPS address routing, delivery assignment, cash-on-delivery collection confirmation |
| **🍱 Customer** | `/customer` | Interactive digital menu, smart cart, bKash/Card/Cash checkout, order history timeline, 5-star dish reviews |

---

## 🐘 Setting Up a Free Neon PostgreSQL Database

1. Sign up or log in at [console.neon.tech](https://console.neon.tech).
2. Create a new project (e.g., `meal-distribution`).
3. Select your preferred region (e.g., `AWS us-east-1` or `eu-central-1`).
4. Copy the connection string from the Dashboard. It will look like:
   ```text
   postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
   ```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20+ (tested with v26)
- **Neon PostgreSQL**: A connection string from [Neon](https://console.neon.tech)

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
Paste your Neon database connection string into `DATABASE_URL`:
```ini
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### 4. Initialize Database Schema & Seed Data
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

All test accounts are automatically provisioned when running `node scripts/migrate.js` or triggering `GET /api/setup`:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@meal.com` | `admin123` |
| **System Admin (Legacy)** | `omi@bracu.edu.bd` | `hashedpass` |
| **Head Chef (Kitchen)** | `kitchen@meal.com` | `kitchen123` |
| **Rider Karim (Delivery)** | `delivery@meal.com` | `delivery123` |
| **Tanvir (Customer)** | `customer@meal.com` | `customer123` |

---

## 🗄️ Relational PostgreSQL Architecture

The database operates on an 8-table relational schema with full foreign-key constraints, cascading deletes, and performance indexes:
- `"Customer"` (Users, address data, role-based access control)
- `"MenuItem"` (Food catalog, pricing, item category)
- `"Order"` (Unique order numbering `26-XXX`, customer link, delivery rider link)
- `"PLACES_ITEM"` (Order line-items bridge)
- `"Order_History"` (Audit trail of status transitions)
- `"Payment"` (bKash, Card, or Cash on Delivery settlement state)
- `"Review"` (Dish ratings and customer feedback)
- `"USER"` (Compatibility view for schema aliases)

### Neon Serverless Features
- **Zero Cold Starts**: Connects via `@neondatabase/serverless` pool.
- **Dual-Casing Normalization**: Query results automatically support both lowercase (Postgres native) and PascalCase (`CustomerID`, `Total_Price`) for total frontend resilience.
- **Safe Transactions**: Multi-table checkouts use atomic `BEGIN` / `COMMIT` / `ROLLBACK` transactions with guaranteed client release.

---

## 🌐 Deploying to Vercel

### Step 1: Push Repository to GitHub
Ensure all changes are committed and pushed to your remote repository.

### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your repository.
3. Keep the default build settings (`next build`) and output directory (`.next`).

### Step 3: Configure Environment Variables in Vercel
Add the following variables in the **Environment Variables** panel:

```ini
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
DB_CONNECTION_LIMIT=10
JWT_SECRET=your-production-secret-key
```

### Step 4: Run Initial Database Setup
Once deployed, initialize the remote database schema and demo seed data by making a single GET request:
```bash
curl https://your-deployment.vercel.app/api/setup
```
You will receive `{ "success": true, "message": "Neon PostgreSQL Database ready! ..." }`.

You can now log in immediately with the pre-seeded demo accounts!

---

## 🛠️ Verification & Linting

Run automated checks:
```bash
npm run lint   # Passes cleanly with 0 errors and 0 warnings
npm run build  # Builds production Turbopack bundles cleanly
```
