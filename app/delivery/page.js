"use client";
import { useState, useEffect } from 'react';

export default function DeliveryDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/delivery');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load delivery tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id) => {
    try {
      const res = await fetch('/api/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      });
      if (res.ok) loadTasks();
    } catch (err) {}
  };

  const getStatusBadge = (status) => {
    if (status === 'Cooking_Done') return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase">Ready for Pickup</span>;
    if (status === 'Dispatched') return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">Out for Delivery</span>;
    return null;
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <nav className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-xl shadow-lg shadow-green-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Rider<span className="text-green-600">Portal</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Deliveries</p>
          </div>
        </div>
        <button 
          onClick={async () => { 
            await fetch('/api/logout', { method: 'POST' });
            localStorage.clear(); 
            window.location.href = '/'; 
          }}
          className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm transition-all border border-transparent hover:border-red-100"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        {loading && tasks.length === 0 ? (
          <div className="text-center py-20 animate-pulse text-gray-400 font-bold">Synchronizing routes...</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Your Task Queue ({tasks.length})</h2>
              <button onClick={loadTasks} className="text-xs font-bold text-blue-600 hover:underline">↻ Refresh</button>
            </div>

            <div className="space-y-4">
              {tasks.map(order => (
                <div key={order.OrderID} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1 block">Order Ref</span>
                      <h3 className="text-2xl font-black text-gray-900 leading-none">#{order.Order_Number}</h3>
                    </div>
                    {getStatusBadge(order.Status)}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-2 rounded-xl mt-1"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{order.CustomerName}</p>
                        <p className="text-sm font-bold text-blue-600">📞 {order.Phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-2 rounded-xl mt-1"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                      <div>
                        <p className="text-sm font-bold text-gray-500 uppercase text-[10px] tracking-widest mb-1">Delivery Destination</p>
                        <p className="text-gray-800 font-semibold leading-snug">
                          {order.House && `House ${order.House}, `}
                          {order.Road && `Road ${order.Road}, `}
                          {order.Street}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => updateStatus(order.OrderID)}
                    className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition transform active:scale-95 ${
                      order.Status === 'Cooking_Done' 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100' 
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
                    }`}
                  >
                    {order.Status === 'Cooking_Done' ? 'Confirm Pick Up' : 'Mark as Delivered'}
                  </button>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl opacity-50">😴</div>
                  <h3 className="text-xl font-bold text-gray-800">Relax, no tasks!</h3>
                  <p className="text-gray-400 font-medium px-10">We'll notify you once the kitchen finishes cooking a new order.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}