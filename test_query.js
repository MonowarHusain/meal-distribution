const mysql = require('mysql2/promise');
const fs = require('fs');

async function fix() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrl = env.match(/DATABASE_URL="?(.*?)"?(?:\n|$)/)[1];
    
    const pool = mysql.createPool({ uri: dbUrl, ssl: { rejectUnauthorized: false } });
    
    // Add DeliveryManID if it doesn't exist
    try {
      await pool.query('ALTER TABLE \`Order\` ADD COLUMN DeliveryManID INT NULL');
      console.log('Successfully added DeliveryManID column to Order table!');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column already exists.');
      } else {
        console.error('Error altering table:', e.message);
      }
    }
  } catch(e) {
    console.error('MySQL Error:', e.message);
  }
  process.exit();
}
fix();
