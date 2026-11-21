"use client";
import { useState, useEffect } from 'react';

export default function DeliveryDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riderId] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          if (userObj.id) return userObj.id;
        }
      } catch {}
    }
    return null;
  });
  const [riders, setRiders] = useState([]);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadTasks = async () => {
    try {
      const [res, ridersRes] = await Promise.all([
        fetch('/api/delivery'),
        fetch('/api/delivery/riders')
      ]);
      const data = await res.json();
      const ridersData = await ridersRes.json();
      if (data.success) setTasks(data.data || []);
      if (ridersData.success) setRiders(ridersData.data || []);
    } catch (err) {
      console.error("Failed to load delivery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDeliveryData = async () => {
      try {
        const [res, ridersRes] = await Promise.all([
          fetch('/api/delivery'),
          fetch('/api/delivery/riders')
        ]);
        const data = await res.json();
        const ridersData = await ridersRes.json();
        if (isMounted) {
          if (data.success) setTasks(data.data || []);
          if (ridersData.success) setRiders(ridersData.data || []);
        }
      } catch (err) {
        console.error("Failed to load delivery data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeliveryData();
    const interval = setInterval(fetchDeliveryData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const updateStatus = async (id) => {
    setUpdatingOrderId(id);
    try {
      const res = await fetch('/api/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, deliverymanId: riderId }),
      });
      if (res.ok) {
        await loadTasks();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update delivery status");
      }
    } catch {
      alert("Network error updating delivery status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Cooking_Done') return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">Ready for Pickup</span>;
    if (status === 'Dispatched') return <span className="bg-sky-100 text-sky-900 border border-sky-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">Out for Delivery</span>;
    return null;
  };

  const isOccupied = riders.find(r => (r.CustomerID === riderId || r.customerid === riderId))?.Status === 'Occupied' ||
                     riders.find(r => (r.CustomerID === riderId || r.customerid === riderId))?.status === 'Occupied';

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 shadow-xs px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-md shadow-emerald-600/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Rider<span className="text-emerald-600">Portal</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Deliveries</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Active Deliverymen */}
          <div className="flex flex-wrap items-center gap-3 border-r pr-6 border-slate-200 max-w-lg justify-end">
            {riders.length === 0 ? (
              <span className="text-xs font-bold text-slate-500">No riders registered</span>
            ) : (
              riders.map(rider => {
                const id = rider.CustomerID || rider.customerid;
                const name = rider.Name || rider.name || '';
                const status = rider.Status || rider.status;
                return (
                  <div key={id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-xs hover:shadow-sm transition" title={status === 'Free' ? 'Available' : 'On Delivery'}>
                    <span className={`w-3 h-3 rounded-full ${status === 'Free' ? 'bg-emerald-500 shadow-xs animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-bold text-slate-800">{name.split(' ')[0]}</span>
                  </div>
                );
              })
            )}
          </div>

          <button 
            onClick={async () => { 
              await fetch('/api/logout', { method: 'POST' });
              localStorage.clear(); 
              window.location.href = '/'; 
            }}
            className="bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:border-red-200 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        {loading && tasks.length === 0 ? (
          <div className="text-center py-20 animate-pulse text-slate-600 font-bold">Synchronizing routes...</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">Your Task Queue ({tasks.length})</h2>
              <button onClick={loadTasks} className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer">↻ Refresh</button>
            </div>

            <div className="space-y-4">
              {tasks.map(order => {
                const id = order.OrderID || order.orderid;
                const orderNum = order.Order_Number || order.order_number;
                const status = order.Status || order.status;
                const custName = order.CustomerName || order.customername;
                const phone = order.Phone || order.phone;
                const house = order.House || order.house;
                const road = order.Road || order.road;
                const street = order.Street || order.street;
                return (
                  <div key={id} className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 hover:shadow-md transition group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1 block">Order Ref</span>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">#{orderNum}</h3>
                      </div>
                      {getStatusBadge(status)}
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-slate-100 p-2.5 rounded-xl mt-1 border border-slate-200"><svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>
                        <div>
                          <p className="text-lg font-bold text-slate-900">{custName}</p>
                          <p className="text-sm font-bold text-blue-700">📞 {phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-slate-100 p-2.5 rounded-xl mt-1 border border-slate-200"><svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                        <div>
                          <p className="font-bold text-slate-600 uppercase text-[10px] tracking-widest mb-1">Delivery Destination</p>
                          <p className="text-slate-900 font-bold leading-snug">
                            {house && `House ${house}, `}
                            {road && `Road ${road}, `}
                            {street || 'Address on file'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => updateStatus(id)}
                      disabled={(status === 'Cooking_Done' && isOccupied) || updatingOrderId === id}
                      className={`w-full py-4 rounded-2xl font-black text-lg shadow-md transition transform active:scale-95 disabled:opacity-50 cursor-pointer ${
                        status === 'Cooking_Done' 
                        ? isOccupied ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none font-bold' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      }`}
                    >
                      {updatingOrderId === id ? 'Updating...' : status === 'Cooking_Done' ? (isOccupied ? 'Finish current delivery first' : 'Confirm Pick Up') : 'Mark as Delivered'}
                    </button>
                  </div>
                );
              })}
              
              {tasks.length === 0 && (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-300">
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">😴</div>
                  <h3 className="text-xl font-bold text-slate-900">Relax, no tasks!</h3>
                  <p className="text-slate-600 font-semibold px-10 text-sm mt-1">We&apos;ll notify you once the kitchen finishes cooking a new order.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
