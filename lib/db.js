import { Pool } from '@neondatabase/serverless';

/**
 * Normalizes PostgreSQL query result rows so both lowercase (native Postgres)
 * and PascalCase (expected by existing frontend components) are available.
 */
export function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const normalized = { ...row };

  const casingMap = {
    customerid: 'CustomerID',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    role: 'Role',
    street: 'Street',
    road: 'Road',
    house: 'House',
    createdat: 'CreatedAt',

    menuitemid: 'MenuItemID',
    price: 'Price',
    image_url: 'Image_URL',
    item_type: 'Item_Type',
    avgrating: 'AvgRating',
    reviewcount: 'ReviewCount',

    orderid: 'OrderID',
    deliverymanid: 'DeliveryManID',
    total_price: 'Total_Price',
    order_number: 'Order_Number',
    order_date: 'Order_Date',
    customername: 'CustomerName',
    customerphone: 'CustomerPhone',
    status: 'Status',
    lateststatus: 'LatestStatus',
    status_date: 'Status_Date',
    historyid: 'HistoryID',

    quantity: 'Quantity',
    subtotal: 'Subtotal',

    payment_id: 'Payment_ID',
    order_id: 'Order_ID',
    payment_method: 'Payment_Method',
    payment_status: 'Payment_Status',
    payment_date: 'Payment_Date',
    amount: 'Amount',

    reviewid: 'ReviewID',
    rating: 'Rating',
    comment: 'Comment'
  };

  for (const [key, val] of Object.entries(row)) {
    const lower = key.toLowerCase();
    if (casingMap[lower] && casingMap[lower] !== key) {
      normalized[casingMap[lower]] = val;
    }
    // Also ensure lowercase access is available if key was originally uppercase
    if (!(lower in normalized)) {
      normalized[lower] = val;
    }
  }

  return normalized;
}

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  );
}

function createPool() {
  const connectionString = getConnectionString();
  const rawPool = connectionString ? new Pool({
    connectionString,
    max: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }) : null;

  return {
    raw: rawPool,

    /**
     * Executes a query returning an array [rows, fields] with attached properties:
     * .rows, .rowCount, .fields, .command
     * This supports both `const [rows] = await pool.query(...)` and `const { rows } = ...`
     */
    async query(sql, params = []) {
      if (!rawPool) {
        throw new Error('Database configuration missing. Please set DATABASE_URL in your environment variables.');
      }
      const res = await rawPool.query(sql, params);
      const rows = (res.rows || []).map(normalizeRow);

      const wrapped = [rows, res.fields];
      wrapped.rows = rows;
      wrapped.rowCount = res.rowCount;
      wrapped.fields = res.fields;
      wrapped.command = res.command;
      return wrapped;
    },

    /**
     * Acquires a dedicated client for multi-query atomic transactions
     */
    async getConnection() {
      if (!rawPool) {
        throw new Error('Database configuration missing. Please set DATABASE_URL in your environment variables.');
      }
      const client = await rawPool.connect();
      return {
        async query(sql, params = []) {
          const res = await client.query(sql, params);
          const rows = (res.rows || []).map(normalizeRow);
          const wrapped = [rows, res.fields];
          wrapped.rows = rows;
          wrapped.rowCount = res.rowCount;
          wrapped.fields = res.fields;
          return wrapped;
        },
        async beginTransaction() {
          return client.query('BEGIN');
        },
        async commit() {
          return client.query('COMMIT');
        },
        async rollback() {
          return client.query('ROLLBACK');
        },
        release() {
          return client.release();
        }
      };
    },

    async connect() {
      if (!rawPool) {
        throw new Error('Database configuration missing. Please set DATABASE_URL in your environment variables.');
      }
      return rawPool.connect();
    },

    async end() {
      if (rawPool) {
        return rawPool.end();
      }
    }
  };
}

// Global caching for Next.js Fast Refresh and Vercel serverless function warm execution
if (!globalThis._neonPool) {
  globalThis._neonPool = createPool();
}

const pool = globalThis._neonPool;

export default pool;
