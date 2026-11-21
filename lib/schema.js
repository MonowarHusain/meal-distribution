import bcrypt from 'bcryptjs';

/**
 * Shared Idempotent Schema Migration & Demo Seeder for Neon Serverless PostgreSQL
 * Used by `scripts/migrate.js`, `scripts/seed-demo.js`, and `/api/setup`
 */
export async function initializeDatabase(dbPool) {
  const steps = [];

  // 1. Customer Table (Stores all system users across roles)
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

  // Compatibility Views for legacy and role-specific queries
  try {
    await dbPool.query(`CREATE OR REPLACE VIEW "USER" AS SELECT * FROM "Customer";`);
    await dbPool.query(`CREATE OR REPLACE VIEW "Admin" AS SELECT * FROM "Customer" WHERE "Role" = 'Admin';`);
    await dbPool.query(`CREATE OR REPLACE VIEW "Kitchen" AS SELECT * FROM "Customer" WHERE "Role" = 'Kitchen';`);
    await dbPool.query(`CREATE OR REPLACE VIEW "DeliveryMan" AS SELECT * FROM "Customer" WHERE "Role" = 'Delivery';`);
    steps.push('Compatibility views verified ("USER", "Admin", "Kitchen", "DeliveryMan")');
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

  // 3. Order Table
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

  // 5. Order_History (Status progression audit timeline)
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

  // 8. Seed Comprehensive Demo Users across all 4 Roles
  const adminHash = await bcrypt.hash('admin123', 10);
  const kitchenHash = await bcrypt.hash('kitchen123', 10);
  const deliveryHash = await bcrypt.hash('delivery123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);

  const demoUsers = [
    [1, 'System Admin', 'admin@meal.com', adminHash, '01711111111', 'Banani 11', 'Block B', 'House 1', 'Admin'],
    [2, 'Monowar Husain Omi', 'omi@bracu.edu.bd', adminHash, '01711111112', 'Mohakhali', 'TB Gate', 'BRACU', 'Admin'],
    [3, 'Head Chef Rahat', 'kitchen@meal.com', kitchenHash, '01722222222', 'Gulshan 1', 'Road 5', 'Kitchen Hub', 'Kitchen'],
    [4, 'Rider Karim', 'delivery@meal.com', deliveryHash, '01733333333', 'Badda', 'Link Road', 'Station 3', 'Delivery'],
    [5, 'Tanvir Customer', 'customer@meal.com', customerHash, '01744444444', 'Dhanmondi 27', 'Road 8A', 'Flat 4B', 'Customer'],
    [6, 'Sous Chef Tareq', 'kitchen2@meal.com', kitchenHash, '01722222223', 'Gulshan 1', 'Road 7', 'Kitchen Hub 2', 'Kitchen'],
    [7, 'Rider Sumon', 'delivery2@meal.com', deliveryHash, '01733333334', 'Rampura', 'DIT Road', 'Station 5', 'Delivery'],
    [8, 'Anika Tabassum', 'anika@meal.com', customerHash, '01744444445', 'Uttara Sector 4', 'Road 12', 'House 18', 'Customer'],
    [9, 'Farhan Ahmed', 'farhan@meal.com', customerHash, '01744444446', 'Mirpur DOHS', 'Avenue 3', 'Flat 2A', 'Customer']
  ];

  for (const u of demoUsers) {
    await dbPool.query(
      `INSERT INTO "Customer" ("CustomerID", "Name", "Email", "Password", "Phone", "Street", "Road", "House", "Role")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT ("Email") DO UPDATE SET
         "Name" = EXCLUDED."Name",
         "Password" = EXCLUDED."Password",
         "Phone" = EXCLUDED."Phone",
         "Role" = EXCLUDED."Role",
         "Street" = EXCLUDED."Street",
         "Road" = EXCLUDED."Road",
         "House" = EXCLUDED."House"`,
      u
    );
  }
  await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Customer"', 'CustomerID'), COALESCE(MAX("CustomerID"), 1)) FROM "Customer";`);
  steps.push('Demo users seeded (Admin, Kitchen, Delivery, Customer) with secure bcrypt credentials');

  // 9. Seed 12 Realistic Menu Items (Regular & Premium categories)
  const menuItems = [
    [1, 'Chicken Biryani', 150.00, '/images/biryani.jpg', 'Premium'],
    [2, 'Beef Tehari', 180.00, '/images/tehari.jpg', 'Premium'],
    [3, 'Standard Student Meal', 80.00, '/images/standard.jpg', 'Regular'],
    [4, 'Khichuri with Egg Curry', 90.00, '/images/khichuri.jpg', 'Regular'],
    [5, 'Special Mutton Kacchi', 240.00, '/images/kacchi.jpg', 'Premium'],
    [6, 'Vegetable Rice Bowl', 70.00, '/images/veg_bowl.jpg', 'Regular'],
    [7, 'Traditional Morog Polao', 190.00, '/images/morog_polao.jpg', 'Premium'],
    [8, 'Plain Rice & Rui Fish Curry', 110.00, '/images/rui_curry.jpg', 'Regular'],
    [9, 'Bhuna Khichuri with Beef', 160.00, '/images/bhuna_khichuri.jpg', 'Premium'],
    [10, 'Vegetable Fried Rice & Chili Chicken', 140.00, '/images/chili_chicken.jpg', 'Regular'],
    [11, 'Shahi Borhani (250ml)', 40.00, '/images/borhani.jpg', 'Regular'],
    [12, 'Traditional Shahi Firni', 50.00, '/images/firni.jpg', 'Regular']
  ];

  for (const item of menuItems) {
    await dbPool.query(
      `INSERT INTO "MenuItem" ("MenuItemID", "Name", "Price", "Image_URL", "Item_Type")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("MenuItemID") DO UPDATE SET
         "Name" = EXCLUDED."Name",
         "Price" = EXCLUDED."Price",
         "Image_URL" = EXCLUDED."Image_URL",
         "Item_Type" = EXCLUDED."Item_Type"`,
      item
    );
  }
  await dbPool.query(`SELECT setval(pg_get_serial_sequence('"MenuItem"', 'MenuItemID'), COALESCE(MAX("MenuItemID"), 1)) FROM "MenuItem";`);
  steps.push('12 demo menu items seeded across Regular and Premium categories');

  // 10. Seed Multi-Stage Demo Orders across all lifecycle stages
  const [existingOrders] = await dbPool.query('SELECT COUNT(*) as count FROM "Order"');
  const orderCount = parseInt(existingOrders[0]?.count || '0', 10);

  if (orderCount < 10) {
    // 10 Detailed Orders: 4 Delivered, 2 Dispatched, 2 Cooking/Accepted, 2 Pending
    const ordersData = [
      // Delivered Orders
      {
        id: 1, customerId: 5, riderId: 4, total: 190.00, num: '26-001',
        dateOffset: "INTERVAL '4 hours'",
        items: [{ itemId: 1, qty: 1 }, { itemId: 11, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '4 hours'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '3 hours 45 minutes'" },
          { status: 'Cooking_Done', offset: "INTERVAL '3 hours 15 minutes'" },
          { status: 'Dispatched', offset: "INTERVAL '3 hours'" },
          { status: 'Delivered', offset: "INTERVAL '2 hours 30 minutes'" }
        ],
        payment: { method: 'bKash', status: 'Completed', amount: 190.00 },
        review: { customerId: 5, itemId: 1, rating: 5, comment: 'Authentic Old Dhaka taste! The chicken was tender and perfectly spiced.' }
      },
      {
        id: 2, customerId: 8, riderId: 4, total: 240.00, num: '26-002',
        dateOffset: "INTERVAL '3 hours'",
        items: [{ itemId: 5, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '3 hours'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '2 hours 40 minutes'" },
          { status: 'Cooking_Done', offset: "INTERVAL '2 hours 10 minutes'" },
          { status: 'Dispatched', offset: "INTERVAL '1 hour 50 minutes'" },
          { status: 'Delivered', offset: "INTERVAL '1 hour 20 minutes'" }
        ],
        payment: { method: 'Card', status: 'Completed', amount: 240.00 },
        review: { customerId: 8, itemId: 5, rating: 5, comment: 'Top quality Kacchi in the area. Melt-in-mouth mutton and fragrant basmati.' }
      },
      {
        id: 3, customerId: 9, riderId: 7, total: 230.00, num: '26-003',
        dateOffset: "INTERVAL '2 hours 30 minutes'",
        items: [{ itemId: 2, qty: 1 }, { itemId: 12, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '2 hours 30 minutes'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '2 hours 15 minutes'" },
          { status: 'Cooking_Done', offset: "INTERVAL '1 hour 45 minutes'" },
          { status: 'Dispatched', offset: "INTERVAL '1 hour 30 minutes'" },
          { status: 'Delivered', offset: "INTERVAL '1 hour'" }
        ],
        payment: { method: 'bKash', status: 'Completed', amount: 230.00 },
        review: { customerId: 9, itemId: 2, rating: 4, comment: 'Great mustard oil aroma and generous beef chunks. Prompt delivery.' }
      },
      {
        id: 4, customerId: 5, riderId: 7, total: 110.00, num: '26-004',
        dateOffset: "INTERVAL '2 hours'",
        items: [{ itemId: 8, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '2 hours'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '1 hour 45 minutes'" },
          { status: 'Cooking_Done', offset: "INTERVAL '1 hour 20 minutes'" },
          { status: 'Dispatched', offset: "INTERVAL '1 hour'" },
          { status: 'Delivered', offset: "INTERVAL '40 minutes'" }
        ],
        payment: { method: 'Cash On Delivery', status: 'Completed', amount: 110.00 },
        review: { customerId: 5, itemId: 8, rating: 5, comment: 'Fresh fish and homely light curry. Excellent for daily lunch.' }
      },

      // Dispatched Orders (Active on Delivery Dashboard)
      {
        id: 5, customerId: 8, riderId: 4, total: 190.00, num: '26-005',
        dateOffset: "INTERVAL '45 minutes'",
        items: [{ itemId: 7, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '45 minutes'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '35 minutes'" },
          { status: 'Cooking_Done', offset: "INTERVAL '20 minutes'" },
          { status: 'Dispatched', offset: "INTERVAL '10 minutes'" }
        ],
        payment: { method: 'bKash', status: 'Completed', amount: 190.00 }
      },
      {
        id: 6, customerId: 9, riderId: 7, total: 180.00, num: '26-006',
        dateOffset: "INTERVAL '35 minutes'",
        items: [{ itemId: 10, qty: 1 }, { itemId: 11, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '35 minutes'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '25 minutes'" },
          { status: 'Cooking_Done', offset: "INTERVAL '15 minutes'" },
          { status: 'Dispatched', offset: "INTERVAL '8 minutes'" }
        ],
        payment: { method: 'Cash On Delivery', status: 'Pending', amount: 180.00 }
      },

      // Active Kitchen Orders (Cooking Done / Kitchen Accepted)
      {
        id: 7, customerId: 5, riderId: null, total: 200.00, num: '26-007',
        dateOffset: "INTERVAL '25 minutes'",
        items: [{ itemId: 9, qty: 1 }, { itemId: 11, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '25 minutes'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '18 minutes'" },
          { status: 'Cooking_Done', offset: "INTERVAL '5 minutes'" }
        ],
        payment: { method: 'bKash', status: 'Completed', amount: 200.00 }
      },
      {
        id: 8, customerId: 8, riderId: null, total: 90.00, num: '26-008',
        dateOffset: "INTERVAL '15 minutes'",
        items: [{ itemId: 4, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '15 minutes'" },
          { status: 'Kitchen_Accepted', offset: "INTERVAL '7 minutes'" }
        ],
        payment: { method: 'Cash On Delivery', status: 'Pending', amount: 90.00 }
      },

      // Pending Orders (Ready for Kitchen Acceptance)
      {
        id: 9, customerId: 9, riderId: null, total: 180.00, num: '26-009',
        dateOffset: "INTERVAL '6 minutes'",
        items: [{ itemId: 2, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '6 minutes'" }
        ],
        payment: { method: 'bKash', status: 'Completed', amount: 180.00 }
      },
      {
        id: 10, customerId: 5, riderId: null, total: 150.00, num: '26-010',
        dateOffset: "INTERVAL '2 minutes'",
        items: [{ itemId: 1, qty: 1 }],
        stages: [
          { status: 'Pending', offset: "INTERVAL '2 minutes'" }
        ],
        payment: { method: 'Card', status: 'Completed', amount: 150.00 }
      }
    ];

    for (const o of ordersData) {
      await dbPool.query(
        `INSERT INTO "Order" ("OrderID", "CustomerID", "DeliveryManID", "Total_Price", "Order_Number", "Order_Date")
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP - ${o.dateOffset})
         ON CONFLICT ("OrderID") DO UPDATE SET
           "CustomerID" = EXCLUDED."CustomerID",
           "DeliveryManID" = EXCLUDED."DeliveryManID",
           "Total_Price" = EXCLUDED."Total_Price",
           "Order_Number" = EXCLUDED."Order_Number"`,
        [o.id, o.customerId, o.riderId, o.total, o.num]
      );

      // Order items
      for (const it of o.items) {
        await dbPool.query(
          `INSERT INTO "PLACES_ITEM" ("OrderID", "MenuItemID", "Quantity")
           VALUES ($1, $2, $3)
           ON CONFLICT ("OrderID", "MenuItemID") DO UPDATE SET "Quantity" = EXCLUDED."Quantity"`,
          [o.id, it.itemId, it.qty]
        );
      }

      // Order history timeline
      for (const st of o.stages) {
        await dbPool.query(
          `INSERT INTO "Order_History" ("OrderID", "Status", "Status_Date")
           VALUES ($1, $2, CURRENT_TIMESTAMP - ${st.offset})`,
          [o.id, st.status]
        );
      }

      // Payment
      await dbPool.query(
        `INSERT INTO "Payment" ("Order_ID", "Payment_Method", "Payment_Status", "Payment_Date", "Amount")
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP - ${o.dateOffset}, $4)`,
        [o.id, o.payment.method, o.payment.status, o.payment.amount]
      );

      // Review (if available)
      if (o.review) {
        await dbPool.query(
          `INSERT INTO "Review" ("CustomerID", "MenuItemID", "OrderID", "Rating", "Comment", "CreatedAt")
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP - ${o.dateOffset})
           ON CONFLICT ("OrderID", "MenuItemID") DO UPDATE SET
             "Rating" = EXCLUDED."Rating",
             "Comment" = EXCLUDED."Comment"`,
          [o.review.customerId, o.review.itemId, o.id, o.review.rating, o.review.comment]
        );
      }
    }

    await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Order"', 'OrderID'), COALESCE(MAX("OrderID"), 1)) FROM "Order";`);
    await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Order_History"', 'HistoryID'), COALESCE(MAX("HistoryID"), 1)) FROM "Order_History";`);
    await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Payment"', 'Payment_ID'), COALESCE(MAX("Payment_ID"), 1)) FROM "Payment";`);
    await dbPool.query(`SELECT setval(pg_get_serial_sequence('"Review"', 'ReviewID'), COALESCE(MAX("ReviewID"), 1)) FROM "Review";`);

    steps.push('10 demo orders seeded across all lifecycle stages with items, audit history, payments, and reviews');
  }

  return { success: true, steps };
}
