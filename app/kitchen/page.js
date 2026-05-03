"use client";

import { useState, useEffect } from 'react';

export default function KitchenDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'menu'
  
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  
  const [newItem, setNewItem] = useState({ name: '', price: '', type: 'Regular' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  const fetchOrders = () => {
    setLoadingOrders(true);
    fetch('/api/kitchen')
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrders(data.data);
        setLoadingOrders(false);
      }).catch(err => setLoadingOrders(false));
  };

  const fetchMenu = () => {
    setLoadingMenu(true);
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMenuItems(data.data);
        setLoadingMenu(false);
      }).catch(err => setLoadingMenu(false));
  };

  useEffect(() => {
    const loadData = () => {
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'menu') fetchMenu();
    };
    
    loadData();
    // Auto-reload disabled as requested
    // const interval = setInterval(loadData, 5000);
    // return () => clearInterval(interval);
  }, [activeTab]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === 'Cooking_Done') {
          // Remove from kitchen view completely
          setOrders(prev => prev.filter(o => o.OrderID !== orderId));
        } else {
          // Move to Cooking list visually
          setOrders(prev => prev.map(o => o.OrderID === orderId ? { ...o, LatestStatus: newStatus } : o));
        }
        if (selectedOrder && selectedOrder.OrderID === orderId) {
          setSelectedOrder(null); // Close modal if open
        }
      } else {
        alert("Failed to update order");
      }
    } catch (err) { alert("Network error"); }
  };

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails(null);
    try {
      const res = await fetch(`/api/orders/${order.OrderID}`);
      const data = await res.json();
      if (data.success) setOrderDetails(data);
    } catch (e) {}
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItem.name, price: parseFloat(newItem.price), type: newItem.type })
      });
      const data = await res.json();
      if (data.success) {
        setNewItem({ name: '', price: '', type: 'Regular' });
        fetchMenu();
      }
    } catch (err) {}
    setIsSubmitting(false);
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to remove this item?")) return;
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setMenuItems(prev => prev.filter(i => i.MenuItemID !== id));
    } catch (err) {}
  };

  const pendingOrders = orders.filter(o => o.LatestStatus === 'Pending');
  const cookingOrders = orders.filter(o => o.LatestStatus === 'Kitchen_Accepted');

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-orange-600 tracking-tight">Kitchen Dashboard</h1>
            <div className="flex gap-6 mt-4">
              <button onClick={() => setActiveTab('orders')} className={`font-bold pb-2 border-b-2 transition-all ${activeTab === 'orders' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                Active Orders
                {pendingOrders.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingOrders.length}</span>}
              </button>
              <button onClick={() => setActiveTab('menu')} className={`font-bold pb-2 border-b-2 transition-all ${activeTab === 'menu' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                Manage Menu
              </button>
            </div>
          </div>
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); window.location.href = '/'; }} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-end mb-6">
              <button onClick={fetchOrders} className="text-sm font-bold text-blue-600 hover:underline">↻ Refresh</button>
            </div>
            
            {loadingOrders ? (
              <div className="text-center py-12 text-gray-500 font-semibold animate-pulse">Loading orders...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Column */}
                <div className="bg-white rounded-3xl p-6 border shadow-sm border-gray-100 min-h-[500px]">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                    New Incoming ({pendingOrders.length})
                  </h2>
                  <div className="space-y-4">
                    {pendingOrders.length === 0 ? <p className="text-gray-400 text-center py-10 font-medium border-2 border-dashed rounded-xl">No new orders waiting.</p> : null}
                    {pendingOrders.map(order => (
                      <div key={order.OrderID} className="border border-orange-200 bg-orange-50/30 rounded-2xl p-5 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-black text-gray-900">#{order.Order_Number}</h3>
                          <span className="text-lg font-bold text-gray-900">৳{order.Total_Price}</span>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button onClick={() => viewOrderDetails(order)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-2.5 rounded-xl transition">Inspect</button>
                          <button onClick={() => updateOrderStatus(order.OrderID, 'Kitchen_Accepted')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow transition hover:-translate-y-0.5">Accept & Cook</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cooking Column */}
                <div className="bg-white rounded-3xl p-6 border shadow-sm border-gray-100 min-h-[500px]">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Currently Cooking ({cookingOrders.length})
                  </h2>
                  <div className="space-y-4">
                    {cookingOrders.length === 0 ? <p className="text-gray-400 text-center py-10 font-medium border-2 border-dashed rounded-xl">Nothing currently cooking.</p> : null}
                    {cookingOrders.map(order => (
                      <div key={order.OrderID} className="border border-blue-200 bg-blue-50/30 rounded-2xl p-5 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-black text-gray-900">#{order.Order_Number}</h3>
                          <button onClick={() => viewOrderDetails(order)} className="text-sm text-blue-600 hover:underline font-bold">View Items</button>
                        </div>
                        <button onClick={() => updateOrderStatus(order.OrderID, 'Cooking_Done')} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition hover:-translate-y-0.5 flex justify-center items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Mark Ready for Delivery
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MENU MANAGEMENT TAB */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white border rounded-2xl shadow-sm p-6 sticky top-32">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Add New Menu Item</h2>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
                    <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (৳)</label>
                    <input required type="number" step="0.01" min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white">
                      <option value="Regular">Regular</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-4 shadow-sm">
                    {isSubmitting ? 'Adding...' : 'Add to Database'}
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Current Live Menu</h2>
                  <button onClick={fetchMenu} className="text-sm font-bold text-blue-600 hover:underline">↻ Refresh</button>
                </div>
                {loadingMenu ? (
                  <div className="text-center py-8 text-gray-500 font-semibold animate-pulse">Loading menu...</div>
                ) : (
                  <div className="space-y-3">
                    {menuItems.map(item => (
                      <div key={item.MenuItemID} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition bg-gray-50 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex justify-center items-center text-xl">{item.Item_Type === 'Premium' ? '⭐' : '🍲'}</div>
                          <div>
                            <h3 className="font-bold text-gray-800">{item.Name}</h3>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.Item_Type === 'Premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>{item.Item_Type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="font-black text-gray-900 text-lg">৳{item.Price}</span>
                          <button onClick={() => handleDeleteItem(item.MenuItemID)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition opacity-0 group-hover:opacity-100">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Order Details Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-black text-2xl text-gray-900">Order #{selectedOrder.Order_Number}</h3>
                <span className="text-sm font-bold text-gray-500 uppercase">{selectedOrder.LatestStatus.replace('_', ' ')}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 text-3xl font-bold transition">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white">
              {!orderDetails ? (
                <div className="text-center py-8 text-gray-500 font-semibold animate-pulse">Fetching cooking instructions...</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-3">Items to Prepare</h4>
                    <div className="space-y-3">
                      {orderDetails.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-4">
                            <span className="font-black text-xl text-orange-600 bg-orange-100 w-10 h-10 flex items-center justify-center rounded-xl">{item.Quantity}x</span>
                            <span className="font-bold text-gray-800 text-lg">{item.Name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
               {selectedOrder.LatestStatus === 'Pending' && (
                 <button onClick={() => updateOrderStatus(selectedOrder.OrderID, 'Kitchen_Accepted')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition">Accept & Cook</button>
               )}
               {selectedOrder.LatestStatus === 'Kitchen_Accepted' && (
                 <button onClick={() => updateOrderStatus(selectedOrder.OrderID, 'Cooking_Done')} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition">Mark Ready</button>
               )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
