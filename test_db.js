const mysql = require('mysql2/promise');
const fs = require('fs');

async function test() {
  const envLocal = fs.readFileSync('.env.local', 'utf8');
  const dbUrlMatch = envLocal.match(/DATABASE_URL="?([^"\n]+)"?/);
  const dbUrl = dbUrlMatch ? dbUrlMatch[1] : '';

  try {
    const conn = await mysql.createConnection({ uri: dbUrl, ssl: { rejectUnauthorized: false } });
    console.log("Connection established.");
    await conn.query("ALTER TABLE Customer ADD COLUMN Role ENUM('Admin', 'Kitchen', 'Delivery', 'Customer') DEFAULT 'Customer'");
    console.log("SUCCESS! Added Role column to Customer table.");
    await conn.end();
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Role column already exists. We are good!");
    } else {
      console.error("FAIL:", e.message);
    }
  }
  process.exit(0);
}

test();
