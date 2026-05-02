import mysql from 'mysql2/promise';

async function migrate() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL || 'mysql://avnadmin:AVNS_bncuFUtMpBCF3Tz96le@mysql-2865dd7f-medical-emergency-system.a.aivencloud.com:28658/defaultdb?ssl-mode=REQUIRED',
  });

  console.log('Running Payment Table Migration...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Payment (
          Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
          Order_ID INT NOT NULL,
          Payment_Method ENUM('Cash On Delivery', 'bKash', 'Card') NOT NULL,
          Payment_Status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
          Payment_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
          Amount DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (Order_ID) REFERENCES \`Order\`(OrderID) ON DELETE CASCADE
      )
    `);
    console.log('Payment table created successfully!');
  } catch(e) { console.log('Payment table creation error:', e.message); }

  console.log('Migration complete.');
  process.exit();
}

migrate();
