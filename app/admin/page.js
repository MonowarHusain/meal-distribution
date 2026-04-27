"use client";
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [stats, setStats] = useState({ users: [], orders: 0 });

  useEffect(() => {
    fetch('/api/admin')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <main className="p-10 font-sans">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Admin Control</h1>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          className="bg-red-600 text-white px-4 py-2 rounded shadow-md font-bold hover:bg-red-700"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* TOTAL ORDERS CARD */}
        <div className="p-8 border rounded-xl shadow-sm bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Total Orders Placed</h2>
          <p className="text-5xl font-black text-blue-600">{stats.orders}</p>
        </div>

        {/* STAFF BREAKDOWN CARD */}
        <div className="p-8 border rounded-xl shadow-sm bg-green-50 border-green-200">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Registered Personnel</h2>
          <div className="space-y-2">
            {stats.users.map(u => (
              <div key={u.Role} className="flex justify-between border-b border-green-100 pb-1">
                <span className="font-medium text-green-900">{u.Role}:</span>
                <span className="font-bold text-green-700">{u.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 p-6 bg-gray-100 rounded-lg text-gray-600 text-sm italic">
        System active. Currently connected to Aiven Cloud MySQL database.
      </div>
    </main>
  );
}