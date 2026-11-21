/**
 * Shared Idempotent Schema Migration & Demo Seeder
 * Used by both `scripts/migrate.js` (CLI) and `/api/setup` (HTTP)
 */
export async function initializeDatabase(dbPool) {
  const steps = [];

  // 1. Customer Table (Users with Roles: Admin, Kitchen, Delivery, Customer)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS Customer (
      CustomerID INT AUTO_INCREMENT PRIMARY KEY,
      Name VARCHAR(255) NOT NULL,
      Email VARCHAR(255) UNIQUE NOT NULL,
      Password VARCHAR(255) NOT NULL,
      Phone VARCHAR(20) NOT NULL,
      Street VARCHAR(255) DEFAULT '',
      Road VARCHAR(255) DEFAULT '',
      House VARCHAR(255) DEFAULT '',
      Role ENUM('Admin', 'Kitchen', 'Delivery', 'Customer') DEFAULT 'Customer',
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_customer_role (Role),
      INDEX idx_customer_email (Email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  steps.push('Customer table verified');

  // Compatibility View for USER
  try {
    await dbPool.query(`CREATE OR REPLACE VIEW \`USER\` AS SELECT * FROM Customer;`);
    steps.push('USER compatibility view verified');
  } catch (viewErr) {
    // If hosted database restricts CREATE VIEW, proceed gracefully
    console.warn('View creation warning (non-fatal):', viewErr.message);
  }

  // 2. MenuItem Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS MenuItem (
      MenuItemID INT AUTO_INCREMENT PRIMARY KEY,
      Name VARCHAR(255) NOT NULL,
      Price DECIMAL(10, 2) NOT NULL,
      Image_URL VARCHAR(255) DEFAULT '',
      Item_Type ENUM('Regular', 'Premium') NOT NULL,
      INDEX idx_menuitem_type (Item_Type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  steps.push('MenuItem table verified');

  // 3. Order Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS \`Order\` (
      OrderID INT AUTO_INCREMENT PRIMARY KEY,
      CustomerID INT NOT NULL,
      DeliveryManID INT NULL,
      Total_Price DECIMAL(10, 2) NOT NULL,
      Order_Number VARCHAR(50) UNIQUE NOT NULL,
      Order_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE CASCADE,
      INDEX idx_order_customer (CustomerID),
      INDEX idx_order_deliveryman (DeliveryManID),
      INDEX idx_order_date (Order_Date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  steps.push('Order table verified');

  // 4. PLACES_ITEM (Order items bridge)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS PLACES_ITEM (
      OrderID INT NOT NULL,
      MenuItemID INT NOT NULL,
      Quantity INT DEFAULT 1 NOT NULL,
      PRIMARY KEY (OrderID, MenuItemID),
      FOREIGN KEY (OrderID) REFERENCES \`Order\`(OrderID) ON DELETE CASCADE,
      FOREIGN KEY (MenuItemID) REFERENCES MenuItem(MenuItemID) ON DELETE CASCADE,
      INDEX idx_places_order (OrderID),
      INDEX idx_places_item (MenuItemID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  steps.push('PLACES_ITEM table verified');

  // 5. Order_History (Status timeline)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS Order_History (
      HistoryID INT AUTO_INCREMENT PRIMARY KEY,
      OrderID INT NOT NULL,
      Status ENUM('Pending', 'Kitchen_Accepted', 'Cooking_Done', 'Dispatched', 'Delivered', 'Refused') DEFAULT 'Pending',
      Status_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (OrderID) REFERENCES \`Order\`(OrderID) ON DELETE CASCADE,
      INDEX idx_history_order (OrderID),
      INDEX idx_history_status (Status),
      INDEX idx_history_date (Status_Date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  steps.push('Order_History table verified');

  // 6. Payment Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS Payment (
      Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
      Order_ID INT NOT NULL,
      Payment_Method ENUM('Cash On Delivery', 'bKash', 'Card') NOT NULL,
      Payment_Status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
      Payment_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      Amount DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (Order_ID) REFERENCES \`Order\`(OrderID) ON DELETE CASCADE,
      INDEX idx_payment_order (Order_ID),
      INDEX idx_payment_status (Payment_Status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  steps.push('Payment table verified');

  // 7. Review Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS Review (
      ReviewID INT AUTO_INCREMENT PRIMARY KEY,
      CustomerID INT NOT NULL,
      MenuItemID INT NOT NULL,
      OrderID INT NOT NULL,
      Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
      Comment TEXT,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE CASCADE,
      FOREIGN KEY (MenuItemID) REFERENCES MenuItem(MenuItemID) ON DELETE CASCADE,
      FOREIGN KEY (OrderID) REFERENCES \`Order\`(OrderID) ON DELETE CASCADE,
      UNIQUE KEY unique_review (OrderID, MenuItemID),
      INDEX idx_review_customer (CustomerID),
      INDEX idx_review_item (MenuItemID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  steps.push('Review table verified');

  // 8. Seed Realistic Demo Users (Admin, Kitchen, Delivery, Customer)
  await dbPool.query(`
    INSERT INTO Customer (CustomerID, Name, Email, Password, Phone, Street, Road, House, Role) VALUES
    (1, 'System Admin', 'admin@meal.com', 'admin123', '01711111111', 'Banani 11', 'Block B', 'House 1', 'Admin'),
    (2, 'Monowar Husain Omi', 'omi@bracu.edu.bd', 'hashedpass', '01711111112', 'Mohakhali', 'TB Gate', 'BRACU', 'Admin'),
    (3, 'Head Chef Rahat', 'kitchen@meal.com', 'kitchen123', '01722222222', 'Gulshan 1', 'Road 5', 'Kitchen Hub', 'Kitchen'),
    (4, 'Rider Karim', 'delivery@meal.com', 'delivery123', '01733333333', 'Badda', 'Link Road', 'Station 3', 'Delivery'),
    (5, 'Tanvir Customer', 'customer@meal.com', 'customer123', '01744444444', 'Dhanmondi 27', 'Road 8A', 'Flat 4B', 'Customer')
    ON DUPLICATE KEY UPDATE 
      Name = VALUES(Name),
      Password = VALUES(Password),
      Phone = VALUES(Phone),
      Role = VALUES(Role);
  `);
  steps.push('Demo users seeded (Admin, Kitchen, Delivery, Customer)');

  // 9. Seed Menu Items
  await dbPool.query(`
    INSERT INTO MenuItem (MenuItemID, Name, Price, Image_URL, Item_Type) VALUES
    (1, 'Chicken Biryani', 150.00, '/images/biryani.jpg', 'Premium'),
    (2, 'Beef Tehari', 180.00, '/images/tehari.jpg', 'Premium'),
    (3, 'Standard Student Meal', 80.00, '/images/standard.jpg', 'Regular'),
    (4, 'Khichuri with Egg Curry', 90.00, '/images/khichuri.jpg', 'Regular'),
    (5, 'Special Mutton Kacchi', 240.00, '/images/kacchi.jpg', 'Premium'),
    (6, 'Vegetable Rice Bowl', 70.00, '/images/veg_bowl.jpg', 'Regular')
    ON DUPLICATE KEY UPDATE 
      Name = VALUES(Name),
      Price = VALUES(Price),
      Item_Type = VALUES(Item_Type);
  `);
  steps.push('Demo menu items seeded');

  // 10. Seed Demo Sample Orders if table is empty
  const [existingOrders] = await dbPool.query('SELECT COUNT(*) as count FROM `Order`');
  if (existingOrders[0].count === 0) {
    // Order 1: Delivered order (ready for customer review)
    await dbPool.query(`
      INSERT INTO \`Order\` (OrderID, CustomerID, DeliveryManID, Total_Price, Order_Number, Order_Date)
      VALUES (1, 5, 4, 150.00, '26-001', DATE_SUB(NOW(), INTERVAL 2 HOUR));
    `);
    await dbPool.query(`
      INSERT INTO PLACES_ITEM (OrderID, MenuItemID, Quantity) VALUES (1, 1, 1);
    `);
    await dbPool.query(`
      INSERT INTO Order_History (OrderID, Status, Status_Date) VALUES
      (1, 'Pending', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
      (1, 'Kitchen_Accepted', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
      (1, 'Cooking_Done', DATE_SUB(NOW(), INTERVAL 60 MINUTE)),
      (1, 'Dispatched', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
      (1, 'Delivered', DATE_SUB(NOW(), INTERVAL 15 MINUTE));
    `);
    await dbPool.query(`
      INSERT INTO Payment (Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount)
      VALUES (1, 'bKash', 'Completed', DATE_SUB(NOW(), INTERVAL 2 HOUR), 150.00);
    `);

    // Order 2: Cooking_Done (ready for delivery rider to pick up)
    await dbPool.query(`
      INSERT INTO \`Order\` (OrderID, CustomerID, DeliveryManID, Total_Price, Order_Number, Order_Date)
      VALUES (2, 5, NULL, 260.00, '26-002', DATE_SUB(NOW(), INTERVAL 30 MINUTE));
    `);
    await dbPool.query(`
      INSERT INTO PLACES_ITEM (OrderID, MenuItemID, Quantity) VALUES (2, 2, 1), (2, 3, 1);
    `);
    await dbPool.query(`
      INSERT INTO Order_History (OrderID, Status, Status_Date) VALUES
      (2, 'Pending', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
      (2, 'Kitchen_Accepted', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
      (2, 'Cooking_Done', DATE_SUB(NOW(), INTERVAL 5 MINUTE));
    `);
    await dbPool.query(`
      INSERT INTO Payment (Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount)
      VALUES (2, 'Cash On Delivery', 'Pending', DATE_SUB(NOW(), INTERVAL 30 MINUTE), 260.00);
    `);

    // Order 3: Pending (ready for kitchen to accept)
    await dbPool.query(`
      INSERT INTO \`Order\` (OrderID, CustomerID, DeliveryManID, Total_Price, Order_Number, Order_Date)
      VALUES (3, 5, NULL, 90.00, '26-003', NOW());
    `);
    await dbPool.query(`
      INSERT INTO PLACES_ITEM (OrderID, MenuItemID, Quantity) VALUES (3, 4, 1);
    `);
    await dbPool.query(`
      INSERT INTO Order_History (OrderID, Status, Status_Date) VALUES
      (3, 'Pending', NOW());
    `);
    await dbPool.query(`
      INSERT INTO Payment (Order_ID, Payment_Method, Payment_Status, Payment_Date, Amount)
      VALUES (3, 'bKash', 'Completed', NOW(), 90.00);
    `);

    steps.push('Demo sample orders initialized for live dashboards');
  }

  return { success: true, steps };
}
