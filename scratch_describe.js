const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrl = env.match(/DATABASE_URL="?([^"\n]+)"?/)[1];
    const c = await mysql.createConnection({uri: dbUrl, ssl: {rejectUnauthorized: false}});
    
    const tables = ['Customer', '`Order`', 'Menu_Item', 'Order_Item', 'Order_History'];
    for (const table of tables) {
        console.log(`\n--- ${table} ---`);
        try {
            const [rows] = await c.query(`DESCRIBE ${table}`);
            console.table(rows);
        } catch (e) { console.log(e.message); }
    }
    process.exit(0);
}

main();
