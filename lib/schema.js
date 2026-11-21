/**
 * Shared Idempotent Schema Migration & Demo Seeder for Neon Serverless PostgreSQL
 * Used by both `scripts/migrate.js` (CLI) and `/api/setup` (HTTP)
 */
export async function initializeDatabase(dbPool) {
  const steps = [];

  // 1. Customer Table (Users with Roles: Admin, Kitchen, Delivery, Customer)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS "Customer" (
      "CustomerID" SERIAL PRIMARY KEY,
      "Name" VARCHAR(255) NOT NULL,
      "Email" VARCHAR(255) UNIQUE NOT NULL,
      "Password" VARCHAR(255) NOT NULL,
      "Phone" VARCHAR(50) NOT NULL DEFAULT '',
      "Street" VARCHAR(255) NOT NULL DEFAULT '',
      "Road" VARCHAR(255) NOT NULL DEFAULT '',
      "House" VARCHAR(255) NOT NULL DEFAULT '',
      "Role" VARCHAR(50) NOT NULL DEFAULT 'Customer' CHECK ("Role" IN ('Admin', 'Kitchen', 'Delivery', 'Customer')),
      "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_customer_role ON "Customer"("Role");
    CREATE INDEX IF NOT EXISTS idx_customer_email ON "Customer"("Email");
  `);
  steps.push('Customer table verified');

  // Compatibility View for "USER"
  try {
    await dbPool.query(`CREATE OR REPLACE VIEW "USER" AS SELECT * FROM "Customer";`);
    steps.push('USER compatibility view verified');
  } catch (viewErr) {
    console.warn('View creation warning (non-fatal):', viewErr.message);
  }

  // 2. MenuItem Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS "MenuItem" (
      "MenuItemID" SERIAL PRIMARY KEY,
      "Name" VARCHAR(255) NOT NULL,
      "Price" NUMERIC(10, 2) NOT NULL,
      "Image_URL" VARCHAR(255) DEFAULT '',
      "Item_Type" VARCHAR(50) NOT NULL CHECK ("Item_Type" IN ('Regular', 'Premium'))
    );
    CREATE INDEX IF NOT EXISTS idx_menuitem_type ON "MenuItem"("Item_Type");
  `);
  steps.push('MenuItem table verified');

  // 3. Order Table (Quotes required as "Order" is a reserved keyword in PostgreSQL)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS "Order" (
      "OrderID" SERIAL PRIMARY KEY,
      "CustomerID" INT NOT NULL REFERENCES "Customer"("CustomerID") ON DELETE CASCADE,
      "DeliveryManID" INT NULL REFERENCES "Customer"("CustomerID") ON DELETE SET NULL,
      "Total_Price" NUMERIC(10, 2) NOT NULL,
      "Order_Number" VARCHAR(50) UNIQUE NOT NULL,
      "Order_Date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_order_customer ON "Order"("CustomerID");
    CREATE INDEX IF NOT EXISTS idx_order_deliveryman ON "Order"("DeliveryManID");
    CREATE INDEX IF NOT EXISTS idx_order_date ON "Order"("Order_Date");
  `);
  steps.push('Order table verified');

  // 4. PLACES_ITEM (Order items bridge)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS "PLACES_ITEM" (
      "OrderID" INT NOT NULL REFERENCES "Order"("OrderID") ON DELETE CASCADE,
      "MenuItemID" INT NOT NULL REFERENCES "MenuItem"("MenuItemID") ON DELETE CASCADE,
      "Quantity" INT NOT NULL DEFAULT 1,
      PRIMARY KEY ("OrderID", "MenuItemID")
    );
    CREATE INDEX IF NOT EXISTS idx_places_order ON "PLACES_ITEM"("OrderID");
    CREATE INDEX IF NOT EXISTS idx_places_item ON "PLACES_ITEM"("MenuItemID");
  `);
  steps.push('PLACES_ITEM table verified');

  // 5. Order_History (Status timeline)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS "Order_History" (
      "HistoryID" SERIAL PRIMARY KEY,
      "OrderID" INT NOT NULL REFERENCES "Order"("OrderID") ON DELETE CASCADE,
      "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ("Status" IN ('Pending', 'Kitchen_Accepted', 'Cooking_Done', 'Dispatched', 'Delivered', 'Refused')),
      "Status_Date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_history_order ON "Order_History"("OrderID");
    CREATE INDEX IF NOT EXISTS idx_history_status ON "Order_History"("Status");
    CREATE INDEX IF NOT EXISTS idx_history_date ON "Order_History"("Status_Date");
  `);
  steps.push('Order_History table verified');

  // 6. Payment Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS "Payment" (
      "Payment_ID" SERIAL PRIMARY KEY,
      "Order_ID" INT NOT NULL REFERENCES "Order"("OrderID") ON DELETE CASCADE,
      "Payment_Method" VARCHAR(50) NOT NULL CHECK ("Payment_Method" IN ('Cash On Delivery', 'bKash', 'Card')),
      "Payment_Status" VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ("Payment_Status" IN ('Pending', 'Completed', 'Failed')),
      "Payment_Date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "Amount" NUMERIC(10, 2) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_payment_order ON "Payment"("Order_ID");
    CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"("Payment_Status");
  `);
  steps.push('Payment table verified');

  // 7. Review Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS "Review" (
      "ReviewID" SERIAL PRIMARY KEY,
      "CustomerID" INT NOT NULL REFERENCES "Customer"("CustomerID") ON DELETE CASCADE,
      "MenuItemID" INT NOT NULL REFERENCES "MenuItem"("MenuItemID") ON DELETE CASCADE,
      "OrderID" INT NOT NULL REFERENCES "Order"("OrderID") ON DELETE CASCADE,
      "Rating" INT NOT NULL CHECK ("Rating" >= 1 AND "Rating" <= 5),
      "Comment" TEXT,
      "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_review UNIQUE ("OrderID", "MenuItemID")
    );
    CREATE INDEX IF NOT EXISTS idx_review_customer ON "Review"("CustomerID");
    CREATE INDEX IF NOT EXISTS idx_review_item ON "Review"("MenuItemID");
  `);
  steps.push('Review table verified');

  // 8. Seed Realistic Demo Users (Admin, Kitchen, Delivery, Customer)
  await dbPool.query(`
    INSERT INTO "Customer" ("CustomerID", "Name", "Email", "Password", "Phone", "Street", "Road", "House", "Role") VALUES
    (1, 'System Admin', 'admin@meal.com', 'admin123', '01711111111', 'Banani 11', 'Block B', 'House 1', 'Admin'),
    (2, 'Monowar Husain Omi', 'omi@bracu.edu.bd', 'hashedpass', '01711111112', 'Mohakhali', 'TB Gate', 'BRACU', 'Admin'),
    (3, 'Head Chef Rahat', 'kitchen@meal.com', 'kitchen123', '01722222222', 'Gulshan 1', 'Road 5', 'Kitchen Hub', 'Kitchen'),
    (4, 'Rider Karim', 'delivery@meal.com', 'delivery123', '01733333333', 'Badda', 'Link Road', 'Station 3', 'Delivery'),
    (5, 'Tanvir Customer', 'customer@meal.com', 'customer123', '01744444444', 'Dhanmondi 27', 'Road 8A', 'Flat 4B', 'Customer')
    ON CONFLICT ("Email") DO UPDATE SET
      "Name" = EXCLUDED."Name",
      "Password" = EXCLUDED."Password",
      "Phone" = EXCLUDED."Phone",
      "Role" = EXCLUDED."Role";
  `);

  // Sync sequence for Customer table
  await dbPool.query(`
    SELECT setval(pg_get_serial_sequence('"Customer"', 'CustomerID'), COALESCE(MAX("CustomerID"), 1)) FROM "Customer";
  `);
  steps.push('Demo users seeded (Admin, Kitchen, Delivery, Customer)');

  // 9. Seed Menu Items
  await dbPool.query(`
    INSERT INTO "MenuItem" ("MenuItemID", "Name", "Price", "Image_URL", "Item_Type") VALUES
    (1, 'Chicken Biryani', 150.00, '/images/biryani.jpg', 'Premium'),
    (2, 'Beef Tehari', 180.00, '/images/tehari.jpg', 'Premium'),
    (3, 'Standard Student Meal', 80.00, '/images/standard.jpg', 'Regular'),
    (4, 'Khichuri with Egg Curry', 90.00, '/images/khichuri.jpg', 'Regular'),
    (5, 'Special Mutton Kacchi', 240.00, '/images/kacchi.jpg', 'Premium'),
    (6, 'Vegetable Rice Bowl', 70.00, '/images/veg_bowl.jpg', 'Regular')
    ON CONFLICT ("MenuItemID") DO UPDATE SET
      "Name" = EXCLUDED."Name",
      "Price" = EXCLUDED."Price",
      "Item_Type" = EXCLUDED."Item_Type";
  `);

  // Sync sequence for MenuItem table
  await dbPool.query(`
    SELECT setval(pg_get_serial_sequence('"MenuItem"', 'MenuItemID'), COALESCE(MAX("MenuItemID"), 1)) FROM "MenuItem";
  `);
  steps.push('Demo menu items seeded');

  // 10. Seed Demo Sample Orders if table is empty
  const [existingOrders] = await dbPool.query('SELECT COUNT(*) as count FROM "Order"');
  const count = parseInt(existingOrders[0]?.count || '0', 10);

  if (count === 0) {
    // Order 1: Delivered order (ready for customer review)
    await dbPool.query(`
      INSERT INTO "Order" ("OrderID", "CustomerID", "DeliveryManID", "Total_Price", "Order_Number", "Order_Date")
      VALUES (1, 5, 4, 150.00, '26-001', CURRENT_TIMESTAMP - INTERVAL '2 hours');
    `);
    await dbPool.query(`
      INSERT INTO "PLACES_ITEM" ("OrderID", "MenuItemID", "Quantity") VALUES (1, 1, 1);
    `);
    await dbPool.query(`
      INSERT INTO "Order_History" ("OrderID", "Status", "Status_Date") VALUES
      (1, 'Pending', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
      (1, 'Kitchen_Accepted', CURRENT_TIMESTAMP - INTERVAL '90 minutes'),
      (1, 'Cooking_Done', CURRENT_TIMESTAMP - INTERVAL '60 minutes'),
      (1, 'Dispatched', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
      (1, 'Delivered', CURRENT_TIMESTAMP - INTERVAL '15 minutes');
    `);
    await dbPool.query(`
      INSERT INTO "Payment" ("Order_ID", "Payment_Method", "Payment_Status", "Payment_Date", "Amount")
      VALUES (1, 'bKash', 'Completed', CURRENT_TIMESTAMP - INTERVAL '2 hours', 150.00);
    `);

    // Order 2: Cooking_Done (ready for delivery rider to pick up)
    await dbPool.query(`
      INSERT INTO "Order" ("OrderID", "CustomerID", "DeliveryManID", "Total_Price", "Order_Number", "Order_Date")
      VALUES (2, 5, NULL, 260.00, '26-002', CURRENT_TIMESTAMP - INTERVAL '30 minutes');
    `);
    await dbPool.query(`
      INSERT INTO "PLACES_ITEM" ("OrderID", "MenuItemID", "Quantity") VALUES (2, 2, 1), (2, 3, 1);
    `);
    await dbPool.query(`
      INSERT INTO "Order_History" ("OrderID", "Status", "Status_Date") VALUES
      (2, 'Pending', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
      (2, 'Kitchen_Accepted', CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
      (2, 'Cooking_Done', CURRENT_TIMESTAMP - INTERVAL '5 minutes');
    `);
    await dbPool.query(`
      INSERT INTO "Payment" ("Order_ID", "Payment_Method", "Payment_Status", "Payment_Date", "Amount")
      VALUES (2, 'Cash On Delivery', 'Pending', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 260.00);
    `);

    // Order 3: Pending (ready for kitchen to accept)
    await dbPool.query(`
      INSERT INTO "Order" ("OrderID", "CustomerID", "DeliveryManID", "Total_Price", "Order_Number", "Order_Date")
      VALUES (3, 5, NULL, 90.00, '26-003', CURRENT_TIMESTAMP);
    `);
    await dbPool.query(`
      INSERT INTO "PLACES_ITEM" ("OrderID", "MenuItemID", "Quantity") VALUES (3, 4, 1);
    `);
    await dbPool.query(`
      INSERT INTO "Order_History" ("OrderID", "Status", "Status_Date") VALUES
      (3, 'Pending', CURRENT_TIMESTAMP);
    `);
    await dbPool.query(`
      INSERT INTO "Payment" ("Order_ID", "Payment_Method", "Payment_Status", "Payment_Date", "Amount")
      VALUES (3, 'bKash', 'Completed', CURRENT_TIMESTAMP, 90.00);
    `);

    // Sync sequences for Order, Order_History, and Payment
    await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Order"', 'OrderID'), COALESCE(MAX("OrderID"), 1)) FROM "Order";`);
    await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Order_History"', 'HistoryID'), COALESCE(MAX("HistoryID"), 1)) FROM "Order_History";`);
    await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Payment"', 'Payment_ID'), COALESCE(MAX("Payment_ID"), 1)) FROM "Payment";`);

    steps.push('Demo sample orders initialized for live dashboards');
  }

  return { success: true, steps };
}
