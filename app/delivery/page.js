"use client";
import { useState, useEffect } from 'react';

export default function DeliveryDashboard() {
  const [tasks, setTasks] = useState([]);

  const loadTasks = () => {
    fetch('/api/delivery')
      .then(res => res.json())
      .then(data => setTasks(data.data || []));
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 10000); // Check for new ready orders every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const markDelivered = async (id) => {
    const res = await fetch('/api/delivery', {
      method: 'PATCH',
      body: JSON.stringify({ orderId: id }),
    });
    if (res.ok) loadTasks();
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">Delivery Dashboard</h1>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="bg-gray-200 px-3 py-1 rounded text-sm font-bold"
          >
            Logout
          </button>
        </header>
        
        <div className="space-y-4">
          {tasks.map(order => (
            <div key={order.OrderID} className="bg-white border-l-8 border-green-500 p-5 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <p className="font-mono text-blue-600 font-bold">#{order.Order_Number}</p>
                <h2 className="text-xl font-semibold">{order.CustomerName}</h2>
                <p className="text-gray-500 text-sm">📞 {order.Phone}</p>
              </div>
              <button 
                onClick={() => markDelivered(order.OrderID)}
                className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 transition"
              >
                Complete
              </button>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 italic">No orders ready for delivery yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}