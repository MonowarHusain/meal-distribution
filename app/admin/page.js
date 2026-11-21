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
    fetch('/api/admin')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData({
            users: resData.users || [],
            orders: resData.orders || [],
            payments: resData.payments || [],
            stats: resData.stats || { totalRevenue: '0.00', totalOrders: 0, totalUsers: 0 }
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
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
      const result = await res.json();
      if (result.success) {
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => (u.CustomerID === customerId || u.customerid === customerId) ? { ...u, Role: newRole, role: newRole } : u)
        }));
      } else {
        alert(result.message || "Failed to update role");
      }
    } catch {
      alert("Network error updating role");
    }
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
          const updatedPayments = prev.payments.map(p => (p.Payment_ID === paymentId || p.payment_id === paymentId) ? { ...p, Payment_Status: newPaymentStatus, payment_status: newPaymentStatus } : p);
          
          // Recalculate Total Revenue based on Completed payments
          const newTotalRevenue = updatedPayments
            .filter(p => (p.Payment_Status || p.payment_status) === 'Completed')
            .reduce((sum, p) => sum + parseFloat(p.Amount || p.amount || 0), 0)
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
      } else {
        alert(result.message || "Failed to update payment status");
      }
    } catch {
      alert("Network error updating payment status");
    }
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
    } catch {
      alert("Network error creating user");
    } finally {
      setIsAddingUser(false);
    }
  };

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails(null);
    try {
      const orderId = order.OrderID || order.orderid;
      const res = await fetch(`/api/orders/${orderId}`);
      const apiData = await res.json();
      if (apiData.success) setOrderDetails(apiData);
    } catch (e) {
      console.error("Order details fetch error:", e);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
      case 'Kitchen_Accepted': return 'bg-sky-100 text-sky-900 border border-sky-300 font-bold';
      case 'Cooking_Done': return 'bg-orange-100 text-orange-900 border border-orange-300 font-bold';
      case 'Dispatched': return 'bg-purple-100 text-purple-900 border border-purple-300 font-bold';
      case 'Delivered': return 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold';
      case 'Refused': return 'bg-rose-100 text-rose-900 border border-rose-300 font-bold';
      default: return 'bg-slate-100 text-slate-800 border border-slate-300 font-bold';
    }
  };

  if (loading && !data.stats) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-slate-600 animate-pulse">Initializing Admin Core...</div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <span className="text-xl">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); window.location.href = '/'; }} className="w-full flex items-center justify-center bg-rose-950/40 text-rose-300 hover:bg-rose-600 hover:text-white px-4 py-3 rounded-xl font-bold transition border border-rose-900/40 cursor-pointer">Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 shadow-xs px-8 py-5 flex justify-between items-center z-10">
          <h2 className="text-2xl font-black text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
          <button onClick={fetchData} className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer">↻ Refresh</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && data.stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 border-l-4 border-l-blue-600">
                  <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-4xl font-black text-slate-900 mt-2">৳{data.stats.totalRevenue}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 border-l-4 border-l-emerald-600">
                  <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Orders Processed</p>
                  <p className="text-4xl font-black text-slate-900 mt-2">{data.stats.totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 border-l-4 border-l-purple-600">
                  <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Registered Users</p>
                  <p className="text-4xl font-black text-slate-900 mt-2">{data.stats.totalUsers}</p>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowAddUser(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition cursor-pointer">
                  + Add Staff / Delivery
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.users.map(user => {
                      const id = user.CustomerID || user.customerid;
                      const name = user.Name || user.name;
                      const email = user.Email || user.email;
                      const role = user.Role || user.role || 'Customer';
                      return (
                        <tr key={id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-mono text-sm text-slate-600 font-bold">#{id}</td>
                          <td className="p-4 font-bold text-slate-900">{name}</td>
                          <td className="p-4 text-slate-700 font-medium">{email}</td>
                          <td className="p-4">
                            <select value={role} onChange={(e) => handleRoleChange(id, e.target.value)} className="font-bold text-sm px-3 py-1.5 rounded-lg border border-slate-300 outline-none bg-white text-slate-900 focus:border-blue-600">
                              <option value="Customer">Customer</option>
                              <option value="Kitchen">Kitchen</option>
                              <option value="Delivery">Delivery</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => setSelectedUser(user)} className="text-blue-700 hover:text-blue-900 font-bold hover:underline text-sm cursor-pointer">View Details</button>
                          </td>
                        </tr>
                      );
                    })}
                    {data.users.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-600 font-bold">No registered users in the database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Order #</th><th className="p-4">Date</th><th className="p-4">Customer</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.orders.map(order => {
                    const id = order.OrderID || order.orderid;
                    const orderNum = order.Order_Number || order.order_number;
                    const orderDate = order.Order_Date || order.order_date;
                    const customerName = order.CustomerName || order.customername;
                    const totalPrice = order.Total_Price || order.total_price;
                    const status = order.Status || order.status || 'Pending';
                    return (
                      <tr key={id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-slate-900">{orderNum}</td>
                        <td suppressHydrationWarning className="p-4 text-slate-600 font-medium text-sm">{new Date(orderDate).toLocaleDateString()}</td>
                        <td className="p-4 font-bold text-slate-900">{customerName}</td>
                        <td className="p-4 font-black text-blue-700">৳{totalPrice}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>{status.replace('_', ' ')}</span></td>
                        <td className="p-4 text-right">
                          <button onClick={() => viewOrderDetails(order)} className="text-blue-700 hover:text-blue-900 font-bold hover:underline text-sm cursor-pointer">View Details</button>
                        </td>
                      </tr>
                    );
                  })}
                  {data.orders.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-600 font-bold">No orders recorded in the system yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Order #</th><th className="p-4">Customer</th><th className="p-4">Method</th><th className="p-4">Amount</th><th className="p-4">Date</th><th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.payments.map(payment => {
                    const id = payment.Payment_ID || payment.payment_id;
                    const orderNum = payment.Order_Number || payment.order_number;
                    const customerName = payment.CustomerName || payment.customername;
                    const method = payment.Payment_Method || payment.payment_method;
                    const amount = payment.Amount || payment.amount;
                    const date = payment.Payment_Date || payment.payment_date;
                    const status = payment.Payment_Status || payment.payment_status || 'Pending';
                    return (
                      <tr key={id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-slate-900">{orderNum}</td>
                        <td className="p-4 font-bold text-slate-900">{customerName}</td>
                        <td className="p-4 font-bold text-slate-800">{method}</td>
                        <td className="p-4 font-black text-blue-700">৳{amount}</td>
                        <td suppressHydrationWarning className="p-4 text-slate-600 font-medium text-sm">{new Date(date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <select 
                            value={status} 
                            onChange={(e) => handlePaymentStatusChange(id, e.target.value)}
                            className={`font-bold text-sm px-3 py-1.5 rounded-lg border outline-none ${status === 'Completed' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {data.payments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-600 font-bold">No payment transactions recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* DELIVERY MGT TAB */}
          {activeTab === 'delivery' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.orders
                    .filter(o => ['Cooking_Done', 'Dispatched', 'Delivered'].includes(o.Status || o.status))
                    .map(order => {
                      const id = order.OrderID || order.orderid;
                      const orderNum = order.Order_Number || order.order_number;
                      const customerName = order.CustomerName || order.customername;
                      const status = order.Status || order.status;
                      const user = data.users.find(u => (u.Name || u.name) === customerName);
                      return (
                        <tr key={id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-bold text-blue-700">{orderNum}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{customerName}</p>
                          </td>
                          <td className="p-4 text-xs text-slate-700 font-medium">
                            {user ? `${user.House || user.house || ''} ${user.Road || user.road || ''} ${user.Street || user.street || ''}`.trim() || 'Address on file' : 'Address Unavailable'}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(status)}`}>
                              {status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {data.orders.filter(o => ['Cooking_Done', 'Dispatched', 'Delivered'].includes(o.Status || o.status)).length === 0 && (
                    <tr><td colSpan="4" className="p-12 text-center text-slate-600 font-bold">No active deliveries tracked yet.</td></tr>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-2xl text-slate-900">Admin Inspect: #{selectedOrder.Order_Number || selectedOrder.order_number}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.Status || selectedOrder.status)}`}>{(selectedOrder.Status || selectedOrder.status || '').replace('_', ' ')}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-red-600 text-3xl font-bold cursor-pointer">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {!orderDetails ? (
                <div className="text-center py-8 text-slate-600 font-bold animate-pulse">Loading deep details...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-600 text-xs uppercase mb-2">Customer Info</h4>
                      <p className="font-bold text-slate-900">{orderDetails.customer?.name || orderDetails.customer?.Name}</p>
                      <p className="text-slate-700 font-medium">{orderDetails.customer?.phone || orderDetails.customer?.Phone || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-600 text-xs uppercase mb-2">Delivery Address</h4>
                      <p className="text-slate-900 font-medium">
                        {(orderDetails.customer?.house || orderDetails.customer?.House) ? `House: ${orderDetails.customer.house || orderDetails.customer.House}, ` : ''}
                        {(orderDetails.customer?.road || orderDetails.customer?.Road) ? `Road: ${orderDetails.customer.road || orderDetails.customer.Road}` : ''}
                      </p>
                      <p className="text-slate-900 font-medium">{orderDetails.customer?.street || orderDetails.customer?.Street || 'Address on file'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Items Ordered</h4>
                    <div className="space-y-2">
                      {(orderDetails.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">{item.Quantity || item.quantity}x</span>
                            <span className="font-bold text-slate-900">{item.Name || item.name}</span>
                          </div>
                          <span className="font-black text-slate-900">৳{item.Subtotal || item.subtotal}</span>
                        </div>
                      ))}
                      {(!orderDetails.items || orderDetails.items.length === 0) && (
                        <p className="text-sm text-slate-500 italic">No item rows found for this order.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Status Timeline</h4>
                    <div className="space-y-2 pl-4 border-l-2 border-blue-300">
                      {(orderDetails.timeline || []).map((event, idx) => (
                        <div key={idx} className="relative before:absolute before:-left-[21px] before:top-1.5 before:w-3 before:h-3 before:bg-blue-600 before:rounded-full before:border-2 before:border-white">
                          <span className="font-bold text-slate-900 mr-3">{(event.Status || event.status || '').replace('_', ' ')}</span>
                          <span suppressHydrationWarning className="text-xs text-slate-600 font-mono font-medium">{new Date(event.Status_Date || event.status_date).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
               <span className="font-bold text-slate-600 uppercase tracking-wider text-sm">Total Transaction</span>
               <span className="font-black text-3xl text-blue-700">৳{selectedOrder.Total_Price || selectedOrder.total_price}</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-2xl text-slate-900">User Profile</h3>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">{selectedUser.Role || selectedUser.role}</span>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-red-600 text-3xl font-bold cursor-pointer">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-600 text-xs uppercase mb-2">Personal Info</h4>
                <p className="font-bold text-slate-900 text-lg">{selectedUser.Name || selectedUser.name}</p>
                <p className="text-slate-700 text-sm mt-1">Email: <span className="font-medium text-slate-900">{selectedUser.Email || selectedUser.email}</span></p>
                <p className="text-slate-700 text-sm">Phone: <span className="font-medium text-slate-900">{selectedUser.Phone || selectedUser.phone || 'N/A'}</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-600 text-xs uppercase mb-2">Delivery Address</h4>
                <p className="text-slate-900 font-medium text-sm">House: {selectedUser.House || selectedUser.house || 'N/A'}</p>
                <p className="text-slate-900 font-medium text-sm">Road: {selectedUser.Road || selectedUser.road || 'N/A'}</p>
                <p className="text-slate-900 font-medium text-sm">Street/Area: {selectedUser.Street || selectedUser.street || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-2xl text-slate-900">Add New Staff</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-red-600 text-3xl font-bold cursor-pointer">&times;</button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-900 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-900 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Phone</label>
                <input required type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-900 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Password</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-900 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white text-slate-900 font-bold">
                  <option value="Delivery">Delivery</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Admin">Admin</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>
              
              <button disabled={isAddingUser} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg transition mt-4 disabled:opacity-50 cursor-pointer">
                {isAddingUser ? 'Adding...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
