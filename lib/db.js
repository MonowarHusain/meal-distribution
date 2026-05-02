import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // This often resolves the ssl-mode warning with Aiven
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;