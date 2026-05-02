"use client";

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [data, setData] = useState({ users: [], orders: [], payments: [], stats: null });
  const [loading, setLoading] = useState(true);

  // Order Details Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add User States
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '', role: 'Delivery' });
  const [isAddingUser, setIsAddingUser] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/admin')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData({
            users: resData.users,
            orders: resData.orders,
            payments: resData.payments || [],
            stats: resData.stats
          });
        }
        setLoading(false);
      }).catch(err => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (customerId, newRole) => {
    const confirmChange = confirm(`Are you sure you want to change this user's role to ${newRole}?`);
    if (!confirmChange) return;

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, newRole })
      });
      if (result.success) {
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => u.CustomerID === customerId ? { ...u, Role: newRole } : u)
        }));
      }
    } catch (err) {}
  };

  const handlePaymentStatusChange = async (paymentId, newPaymentStatus) => {
    const confirmChange = confirm(`Update payment status to ${newPaymentStatus}?`);
    if (!confirmChange) return;

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, newPaymentStatus })
      });
      const result = await res.json();
      if (result.success) {
        setData(prev => {
          const updatedPayments = prev.payments.map(p => p.Payment_ID === paymentId ? { ...p, Payment_Status: newPaymentStatus } : p);
          
          // Recalculate Total Revenue based on Completed payments
          const newTotalRevenue = updatedPayments
            .filter(p => p.Payment_Status === 'Completed')
            .reduce((sum, p) => sum + parseFloat(p.Amount), 0)
            .toFixed(2);

          return {
            ...prev,
            payments: updatedPayments,
            stats: {
              ...prev.stats,
              totalRevenue: newTotalRevenue
            }
          };
        });
      }
    } catch (err) {}
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const result = await res.json();
      if (result.success) {
        alert("Staff added successfully!");
        setShowAddUser(false);
        setNewUser({ name: '', email: '', password: '', phone: '', role: 'Delivery' });
        fetchData();
      } else {
        alert(result.message || "Failed to add user");
      }
    } catch (err) {
      alert("Network error");
    }
    setIsAddingUser(false);
  };

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails(null);
    try {
      const res = await fetch(`/api/orders/${order.OrderID}`);
      const apiData = await res.json();
      if (apiData.success) setOrderDetails(apiData);
    } catch (e) {}
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Kitchen_Accepted': return 'bg-blue-100 text-blue-800';
      case 'Cooking_Done': return 'bg-orange-100 text-orange-800';
      case 'Dispatched': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Refused': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !data.stats) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 animate-pulse">Initializing Admin Core...</div>;

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black tracking-wider text-blue-400">ADMIN<span className="text-white">CORE</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', icon: '📊', label: 'System Overview' },
            { id: 'users', icon: '👥', label: 'User Management' },
            { id: 'orders', icon: '📦', label: 'Global Orders' },
            { id: 'delivery', icon: '🚚', label: 'Delivery Mgt.' },
            { id: 'payments', icon: '💳', label: 'Payments Mgt.' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span className="text-xl">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); window.location.href = '/'; }} className="w-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3 rounded-lg font-bold transition">Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b shadow-sm px-8 py-5 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab.replace('-', ' ')}</h2>
          <button onClick={fetchData} className="text-sm font-bold text-blue-600 hover:underline">↻ Refresh</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && data.stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-l-4 border-l-blue-500"><p className="text-sm font-bold text-gray-500 uppercase">Total Revenue</p><p className="text-4xl font-black text-gray-900">৳{data.stats.totalRevenue}</p></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-l-4 border-l-green-500"><p className="text-sm font-bold text-gray-500 uppercase">Orders Processed</p><p className="text-4xl font-black text-gray-900">{data.stats.totalOrders}</p></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-l-4 border-l-purple-500"><p className="text-sm font-bold text-gray-500 uppercase">Registered Users</p><p className="text-4xl font-black text-gray-900">{data.stats.totalUsers}</p></div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowAddUser(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition">
                  + Add Staff / Delivery
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                    <th className="p-4 font-bold">ID</th><th className="p-4 font-bold">Name</th><th className="p-4 font-bold">Email</th><th className="p-4 font-bold">Role</th><th className="p-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.users.map(user => (
                    <tr key={user.CustomerID} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm text-gray-500">#{user.CustomerID}</td>
                      <td className="p-4 font-bold">{user.Name}</td>
                      <td className="p-4 text-gray-600">{user.Email}</td>
                      <td className="p-4">
                        <select value={user.Role} onChange={(e) => handleRoleChange(user.CustomerID, e.target.value)} className="font-bold text-sm px-3 py-1.5 rounded-lg border outline-none">
                          <option value="Customer">Customer</option><option value="Kitchen">Kitchen</option><option value="Delivery">Delivery</option><option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:text-blue-800 font-bold hover:underline text-sm">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                    <th className="p-4 font-bold">Order #</th><th className="p-4 font-bold">Date</th><th className="p-4 font-bold">Customer</th><th className="p-4 font-bold">Total</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.orders.map(order => (
                    <tr key={order.OrderID} className="hover:bg-gray-50">
                      <td className="p-4 font-bold">{order.Order_Number}</td>
                      <td suppressHydrationWarning className="p-4 text-gray-600 text-sm">{new Date(order.Order_Date).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold">{order.CustomerName}</td>
                      <td className="p-4 font-black text-blue-600">৳{order.Total_Price}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.Status)}`}>{order.Status.replace('_', ' ')}</span></td>
                      <td className="p-4 text-right">
                        <button onClick={() => viewOrderDetails(order)} className="text-blue-600 hover:text-blue-800 font-bold hover:underline text-sm">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                    <th className="p-4 font-bold">Order #</th><th className="p-4 font-bold">Customer</th><th className="p-4 font-bold">Method</th><th className="p-4 font-bold">Amount</th><th className="p-4 font-bold">Date</th><th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.payments.map(payment => (
                    <tr key={payment.Payment_ID} className="hover:bg-gray-50">
                      <td className="p-4 font-bold">{payment.Order_Number}</td>
                      <td className="p-4 font-semibold">{payment.CustomerName}</td>
                      <td className="p-4 font-bold text-gray-700">{payment.Payment_Method}</td>
                      <td className="p-4 font-black text-blue-600">৳{payment.Amount}</td>
                      <td suppressHydrationWarning className="p-4 text-gray-600 text-sm">{new Date(payment.Payment_Date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <select 
                          value={payment.Payment_Status} 
                          onChange={(e) => handlePaymentStatusChange(payment.Payment_ID, e.target.value)}
                          className={`font-bold text-sm px-3 py-1.5 rounded-lg border outline-none ${payment.Payment_Status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* DELIVERY MGT TAB */}
          {activeTab === 'delivery' && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                    <th className="p-4 font-bold">Order #</th>
                    <th className="p-4 font-bold">Customer</th>
                    <th className="p-4 font-bold">Address</th>
                    <th className="p-4 font-bold">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.orders
                    .filter(o => ['Cooking_Done', 'Dispatched', 'Delivered'].includes(o.Status))
                    .map(order => {
                      // Find the full user details for address if available in data.users
                      const user = data.users.find(u => u.Name === order.CustomerName);
                      return (
                        <tr key={order.OrderID} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-blue-600">{order.Order_Number}</td>
                          <td className="p-4">
                            <p className="font-bold">{order.CustomerName}</p>
                          </td>
                          <td className="p-4 text-xs text-gray-600">
                            {user ? `${user.House || ''} ${user.Road || ''} ${user.Street || ''}` : 'Address Unavailable'}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.Status)}`}>
                              {order.Status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {data.orders.filter(o => ['Cooking_Done', 'Dispatched', 'Delivered'].includes(o.Status)).length === 0 && (
                    <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-bold">No active deliveries tracked yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
        </div>
      </main>

      {/* Admin Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-black text-2xl text-gray-900">Admin Inspect: #{selectedOrder.Order_Number}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.Status)}`}>{selectedOrder.Status.replace('_', ' ')}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 text-3xl font-bold">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {!orderDetails ? (
                <div className="text-center py-8 text-gray-500 font-semibold animate-pulse">Loading deep details...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-xl border">
                      <h4 className="font-bold text-gray-500 text-xs uppercase mb-2">Customer Info</h4>
                      <p className="font-bold text-gray-900">{orderDetails.customer?.Name}</p>
                      <p className="text-gray-600">{orderDetails.customer?.Phone}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border">
                      <h4 className="font-bold text-gray-500 text-xs uppercase mb-2">Delivery Address</h4>
                      <p className="text-gray-800 font-medium">{orderDetails.customer?.House ? `House: ${orderDetails.customer.House}, ` : ''}{orderDetails.customer?.Road ? `Road: ${orderDetails.customer.Road}` : ''}</p>
                      <p className="text-gray-800 font-medium">{orderDetails.customer?.Street}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-3">Items Ordered</h4>
                    <div className="space-y-2">
                      {orderDetails.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white border rounded-lg">
                          <div className="flex items-center gap-3"><span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.Quantity}x</span><span className="font-bold">{item.Name}</span></div>
                          <span className="font-black">৳{item.Subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-3">Status Timeline</h4>
                    <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                      {orderDetails.timeline.map((event, idx) => (
                        <div key={idx} className="relative before:absolute before:-left-[21px] before:top-1.5 before:w-3 before:h-3 before:bg-blue-500 before:rounded-full before:border-2 before:border-white">
                          <span className="font-bold text-gray-800 mr-3">{event.Status.replace('_', ' ')}</span>
                          <span suppressHydrationWarning className="text-xs text-gray-500 font-mono">{new Date(event.Status_Date).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
               <span className="font-bold text-gray-500 uppercase">Total Transaction</span>
               <span className="font-black text-3xl text-blue-600">৳{selectedOrder.Total_Price}</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-black text-2xl text-gray-900">User Profile</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800`}>{selectedUser.Role}</span>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-red-500 text-3xl font-bold">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <h4 className="font-bold text-gray-500 text-xs uppercase mb-2">Personal Info</h4>
                <p className="font-bold text-gray-900 text-lg">{selectedUser.Name}</p>
                <p className="text-gray-600">Email: {selectedUser.Email}</p>
                <p className="text-gray-600">Phone: {selectedUser.Phone || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border">
                <h4 className="font-bold text-gray-500 text-xs uppercase mb-2">Delivery Address</h4>
                <p className="text-gray-800 font-medium">House: {selectedUser.House || 'N/A'}</p>
                <p className="text-gray-800 font-medium">Road: {selectedUser.Road || 'N/A'}</p>
                <p className="text-gray-800 font-medium">Street/Area: {selectedUser.Street || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-2xl text-gray-900">Add New Staff</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-red-500 text-3xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                <input required type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="Delivery">Delivery</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              
              <button disabled={isAddingUser} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition mt-4 disabled:opacity-50">
                {isAddingUser ? 'Adding...' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}