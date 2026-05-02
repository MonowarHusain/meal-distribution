import mysql from 'mysql2/promise';
import 'dotenv/config'; // This loads your .env variables automatically

async function migrate() {
  // Use ONLY the environment variable. 
  // Removing the hardcoded fallback prevents the GitHub leak.
  const dbUri = process.env.DATABASE_URL;

  if (!dbUri) {
    console.error("❌ Error: DATABASE_URL is not defined in your .env file.");
    process.exit(1);
  }

  const pool = mysql.createPool({ uri: dbUri });

  console.log('Running Payment Table Migration...');
  try {
    // This creates the Payment table for your 8-table normalized schema
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
    console.log('✅ Payment table created successfully!');
  } catch (e) {
    console.log('❌ Payment table creation error:', e.message);
  }

  console.log('Migration complete.');
  await pool.end(); // Properly close the connection
  process.exit();
}

migrate();