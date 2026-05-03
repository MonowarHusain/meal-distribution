import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
    try {
        // 1. Create MenuItem Table & Insert Food
        await pool.query(`
      CREATE TABLE IF NOT EXISTS MenuItem (
          MenuItemID INT AUTO_INCREMENT PRIMARY KEY,
          Name VARCHAR(255) NOT NULL,
          Price DECIMAL(10, 2) NOT NULL,
          Image_URL VARCHAR(255),
          Item_Type ENUM('Regular', 'Premium') NOT NULL
      )
    `);

        await pool.query(`
      INSERT IGNORE INTO MenuItem (MenuItemID, Name, Price, Image_URL, Item_Type) VALUES
      (1, 'Chicken Biryani', 150.00, '/images/biryani.jpg', 'Premium'),
      (2, 'Beef Tehari', 180.00, '/images/tehari.jpg', 'Premium'),
      (3, 'Standard Student Meal', 80.00, '/images/standard.jpg', 'Regular')
    `);

        // 2. Create Customer Table & Insert Your User
        await pool.query(`
      CREATE TABLE IF NOT EXISTS Customer (
          CustomerID INT AUTO_INCREMENT PRIMARY KEY,
          Name VARCHAR(255) NOT NULL,
          Email VARCHAR(255) UNIQUE NOT NULL,
          Password VARCHAR(255) NOT NULL,
          Phone VARCHAR(20) NOT NULL,
          Street VARCHAR(255) DEFAULT '',
          Road VARCHAR(255) DEFAULT '',
          House VARCHAR(255) DEFAULT '',
          Role ENUM('Admin', 'Kitchen', 'Delivery', 'Customer') DEFAULT 'Customer'
      )
    `);
        await pool.query(`
      INSERT IGNORE INTO Customer (CustomerID, Name, Email, Password, Phone, Role) VALUES
      (1, 'Monowar Husain Omi', 'omi@bracu.edu.bd', 'hashedpass', '01711111111', 'Admin')
    `);

        // 3. Create the Order Tables
        await pool.query(`
      CREATE TABLE IF NOT EXISTS \`Order\` (
          OrderID INT AUTO_INCREMENT PRIMARY KEY,
          CustomerID INT NOT NULL,
          DeliveryManID INT NULL,
          Total_Price DECIMAL(10, 2) NOT NULL,
          Order_Number VARCHAR(50) UNIQUE NOT NULL,
          Order_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE CASCADE
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS PLACES_ITEM (
          OrderID INT NOT NULL,
          MenuItemID INT NOT NULL,
          Quantity INT DEFAULT 1 NOT NULL,
          PRIMARY KEY (OrderID, MenuItemID),
          FOREIGN KEY (OrderID) REFERENCES \`Order\`(OrderID) ON DELETE CASCADE,
          FOREIGN KEY (MenuItemID) REFERENCES MenuItem(MenuItemID) ON DELETE CASCADE
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS Order_History (
          HistoryID INT AUTO_INCREMENT PRIMARY KEY,
          OrderID INT NOT NULL,
          Status ENUM('Pending', 'Kitchen_Accepted', 'Cooking_Done', 'Dispatched', 'Delivered', 'Refused') DEFAULT 'Pending',
          Status_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (OrderID) REFERENCES \`Order\`(OrderID) ON DELETE CASCADE
      )
    `);

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

        await pool.query(`
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
          UNIQUE KEY unique_review (OrderID, MenuItemID)
      )
    `);

        return NextResponse.json({ success: true, message: 'DATABASE READY! All tables and data created.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to build database' }, { status: 500 });
    }
}
