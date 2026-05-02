const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrl = env.match(/DATABASE_URL="?([^"\n]+)"?/)[1];
    const c = await mysql.createConnection({uri: dbUrl, ssl: {rejectUnauthorized: false}});
    const [rows] = await c.query('DESCRIBE Customer');
    console.log(rows);
    process.exit(0);
}

main();
