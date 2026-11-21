import mysql from 'mysql2/promise';

function createPool() {
  const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

  // SSL is enabled by default for managed databases (Aiven, TiDB Cloud, etc.)
  // Set DB_SSL=false or DATABASE_SSL=false to disable for local testing without SSL
  const sslDisabled = process.env.DB_SSL === 'false' || process.env.DATABASE_SSL === 'false';
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
  const sslConfig = sslDisabled ? undefined : { rejectUnauthorized };

  // Hardened serverless connection pool settings
  const baseConfig = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    maxIdle: 2,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 15000,
  };

  if (connectionUri) {
    return mysql.createPool({
      ...baseConfig,
      uri: connectionUri,
      ...(sslDisabled ? {} : { ssl: sslConfig }),
    });
  }

  return mysql.createPool({
    ...baseConfig,
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'meal_distribution',
    ...(sslDisabled ? {} : { ssl: sslConfig }),
  });
}

// Global caching for Next.js Fast Refresh and Vercel serverless function warm execution
if (!globalThis._mysqlPool) {
  globalThis._mysqlPool = createPool();
}

const pool = globalThis._mysqlPool;

export default pool;
