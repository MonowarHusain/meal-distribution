"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the menu from the database
  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenuItems(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch menu:", err);
        setLoading(false);
      });
  }, []);

  // Place an order function
  const handleOrder = async (menuItemId, price) => {
    alert("Placing order... please wait.");

    const orderData = {
      customerId: 1, // Hardcoded to CustomerID 1 (Monowar) for the demo
      totalPrice: parseFloat(price),
      items: [
        { menuItemId: menuItemId, quantity: 1 }
      ]
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();

      if (result.success) {
        alert(`Success! Your order number is: ${result.orderNumber}`);
      } else {
        alert('Failed to place order.');
      }
    } catch (error) {
      alert('Error connecting to the server.');
    }
  };

  if (loading) return <div className="p-8 text-center text-xl font-semibold">Loading menu from Aiven Database...</div>;

  return (
    <main className="p-8 max-w-4xl mx-auto font-sans">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Available Menu</h1>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-200"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <div key={item.MenuItemID} className="border border-gray-200 p-5 rounded-xl shadow-sm relative">
            {/* Visible Menu ID */}
            <span className="absolute top-2 right-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
              {(item.Item_Type === 'Premium' ? 'P' : 'R') + String(item.MenuItemID).padStart(3, '0')}
            </span>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{item.Name}</h2>
                <span className={`inline-block mt-1 text-xs font-bold px-2 py-1 rounded ${item.Item_Type === 'Premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                  {item.Item_Type}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900">৳{item.Price}</span>
            </div>

            <button
              onClick={() => handleOrder(item.MenuItemID, item.Price)}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Order Now
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
