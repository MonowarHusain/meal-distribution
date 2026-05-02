"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'orders', 'profile'
  const [menuItems, setMenuItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cart States
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerId, setCustomerId] = useState(1);
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Profile States
  const [profile, setProfile] = useState({ Name: '', Phone: '', Street: '', Road: '', House: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Order Details Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  // Initialize Session
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.id) setCustomerId(userObj.id);
      }
    } catch(e) {}
  }, []);

  // Fetch Menu
  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenuItems(data.data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  // Fetch Order History & Profile
  useEffect(() => {
    if (activeTab === 'orders') {
      setLoading(true);
      fetch(`/api/customer/orders?customerId=${customerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setOrderHistory(data.orders);
          setLoading(false);
        }).catch(() => setLoading(false));
    } else if (activeTab === 'profile') {
      setLoading(true);
      fetch(`/api/customer/profile?customerId=${customerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setProfile(data.profile);
          setLoading(false);
        }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeTab, customerId]);

  // Cart Functions
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(i => i.MenuItemID === item.MenuItemID);
      if (existing) {
        return prev.map(i => i.MenuItemID === item.MenuItemID ? { ...i, Quantity: i.Quantity + 1 } : i);
      }
      return [...prev, { ...item, Quantity: 1 }];
    });
    setIsCartOpen(true);
  };
  const increment = (id) => setCart(prev => prev.map(i => i.MenuItemID === id ? { ...i, Quantity: i.Quantity + 1 } : i));
  const decrement = (id) => setCart(prev => prev.map(i => i.MenuItemID === id ? { ...i, Quantity: Math.max(1, i.Quantity - 1) } : i));
  const remove = (id) => setCart(prev => prev.filter(i => i.MenuItemID !== id));
  const totalPrice = cart.reduce((sum, item) => sum + (parseFloat(item.Price) * item.Quantity), 0);

  // Checkout & Payment
  const triggerPayment = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
    setIsCartOpen(false); // Close cart to focus on payment
  };

  const executeCheckout = async (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    const orderData = {
      customerId: customerId,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      items: cart.map(item => ({ menuItemId: item.MenuItemID, quantity: item.Quantity }))
    };
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      if (result.success) {
        setCart([]); setShowPaymentModal(false); setActiveTab('orders');
        setTimeout(() => alert(`Order Confirmed! Your order number is: ${result.orderNumber}`), 300);
      } else {
        alert('Failed to place order.');
      }
    } catch (error) { alert('Error connecting to server.'); }
    setIsProcessingPayment(false);
  };

  // Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, ...profile, name: profile.Name, phone: profile.Phone, street: profile.Street, road: profile.Road, house: profile.House })
      });
      const data = await res.json();
      if (data.success) alert("Profile updated successfully!");
      else alert("Failed to update profile.");
    } catch (err) { alert("Network error."); }
    setIsSavingProfile(false);
  };

  // Order Details
  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails(null);
    try {
      const res = await fetch(`/api/orders/${order.OrderID}`);
      const data = await res.json();
      if (data.success) setOrderDetails(data);
    } catch (e) { console.error("Details fetch error:", e); }
  };

  // UI Helpers
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Kitchen_Accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cooking_Done': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Dispatched': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Refused': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <main className="p-8 max-w-5xl mx-auto font-sans relative pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
          <div className="flex gap-6 mt-4">
            {['menu', 'orders', 'profile'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-bold pb-2 border-b-2 transition capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {tab === 'menu' ? 'Order Menu' : tab === 'orders' ? 'My Orders' : 'My Profile'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {activeTab === 'menu' && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition"
            >
              Cart 🛒
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md">
                  {cart.length}
                </span>
              )}
            </button>
          )}
          <button 
            onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); window.location.href = '/'; }}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition border border-red-100"
          >
            Logout
          </button>
        </div>
      </header>

      {loading && <div className="text-center py-12 text-xl font-semibold text-gray-500 animate-pulse">Loading data...</div>}

      {/* MENU TAB */}
      {!loading && activeTab === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div key={item.MenuItemID} className="border border-gray-200 p-5 rounded-2xl shadow-sm relative bg-white hover:shadow-md transition">
              <span className="absolute top-3 right-3 font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-bold">
                {(item.Item_Type === 'Premium' ? 'P' : 'R') + String(item.MenuItemID).padStart(3, '0')}
              </span>
              <div className="text-4xl mb-4">{item.Item_Type === 'Premium' ? '⭐' : '🍲'}</div>
              <h2 className="text-xl font-bold text-gray-800">{item.Name}</h2>
              <span className={`inline-block mt-1 mb-4 text-xs font-bold px-2 py-1 rounded ${item.Item_Type === 'Premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                {item.Item_Type}
              </span>
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                <span className="text-2xl font-black text-gray-900">৳{item.Price}</span>
                <button
                  onClick={() => addToCart(item)}
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition transform hover:-translate-y-0.5"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MY ORDERS TAB */}
      {!loading && activeTab === 'orders' && (
        <div className="space-y-4">
          {orderHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              You haven't placed any orders yet.
            </div>
          ) : (
            orderHistory.map(order => (
              <div key={order.OrderID} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-black text-gray-900 text-xl">Order #{order.Order_Number}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.Status)}`}>
                      {order.Status.replace('_', ' ')}
                    </span>
                  </div>
                  <p suppressHydrationWarning className="text-sm text-gray-500 font-medium">
                    Placed on: {new Date(order.Order_Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Paid</p>
                    <p className="font-black text-gray-900 text-2xl">৳{order.Total_Price}</p>
                  </div>
                  <button 
                    onClick={() => viewOrderDetails(order)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-bold transition"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MY PROFILE TAB */}
      {!loading && activeTab === 'profile' && (
        <div className="max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal & Delivery Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input required type="text" value={profile.Name || ''} onChange={e => setProfile({...profile, Name: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                <input required type="text" value={profile.Phone || ''} onChange={e => setProfile({...profile, Phone: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">House</label>
                  <input type="text" value={profile.House || ''} onChange={e => setProfile({...profile, House: e.target.value})} placeholder="e.g. 42B" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Road</label>
                  <input type="text" value={profile.Road || ''} onChange={e => setProfile({...profile, Road: e.target.value})} placeholder="e.g. 7" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Street/Area</label>
                  <input type="text" value={profile.Street || ''} onChange={e => setProfile({...profile, Street: e.target.value})} placeholder="e.g. Mohakhali" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
            </div>
            <button disabled={isSavingProfile} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 mt-4 shadow-sm hover:shadow-md">
              {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      )}

      {/* Order Details Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-black text-2xl text-gray-900">Order #{selectedOrder.Order_Number}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedOrder.Status)}`}>
                  {selectedOrder.Status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 text-3xl font-bold transition">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!orderDetails ? (
                <div className="text-center py-8 text-gray-500 font-semibold animate-pulse">Loading order details...</div>
              ) : (
                <div className="space-y-6">
                  {/* Items List */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-3">Items Ordered</h4>
                    <div className="space-y-3">
                      {orderDetails.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-blue-600 bg-blue-100 w-8 h-8 flex items-center justify-center rounded-lg">{item.Quantity}x</span>
                            <span className="font-bold text-gray-800">{item.Name}</span>
                          </div>
                          <span className="font-black text-gray-900">৳{item.Subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-3 pt-4 border-t border-gray-100">Order Timeline</h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:to-transparent">
                      {orderDetails.timeline.map((event, idx) => (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-gray-100 bg-white shadow-sm">
                            <div className="font-bold text-gray-800 text-sm mb-1">{event.Status.replace('_', ' ')}</div>
                            <time suppressHydrationWarning className="block text-xs font-medium text-gray-500">
                              {new Date(event.Status_Date).toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' })} - {new Date(event.Status_Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </time>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
               <span className="font-bold text-gray-500 uppercase tracking-wider text-sm">Total Paid</span>
               <span className="font-black text-3xl text-blue-600">৳{selectedOrder.Total_Price}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar Overlay */}
      {isCartOpen && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCartOpen(false)} />}
      
      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-2xl font-extrabold text-gray-800">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-3xl transition">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {cart.length === 0 ? (
             <div className="text-center text-gray-500 mt-10 font-medium">Your cart is empty.</div>
          ) : (
            cart.map(item => (
              <div key={item.MenuItemID} className="flex gap-4 items-center bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.Name}</h3>
                  <div className="text-blue-600 font-black text-sm">৳{item.Price}</div>
                  <div className="flex items-center gap-3 mt-2 bg-gray-50 w-fit rounded-lg border border-gray-200">
                    <button onClick={() => decrement(item.MenuItemID)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 text-gray-600 font-bold transition rounded-l-lg">-</button>
                    <span className="font-bold text-gray-800 w-4 text-center text-sm">{item.Quantity}</span>
                    <button onClick={() => increment(item.MenuItemID)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 text-gray-600 font-bold transition rounded-r-lg">+</button>
                  </div>
                </div>
                <button onClick={() => remove(item.MenuItemID)} className="text-red-400 hover:text-red-600 p-2 transition bg-red-50 hover:bg-red-100 rounded-lg">✕</button>
              </div>
            ))
          )}
        </div>
        <div className="p-6 border-t bg-white shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg text-gray-500 font-bold">Total Amount:</span>
            <span className="text-3xl font-black text-blue-600">৳{totalPrice.toFixed(2)}</span>
          </div>
          <button onClick={triggerPayment} disabled={cart.length === 0} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'}`}>
            Proceed to Payment
          </button>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-2xl text-gray-900">Secure Checkout</h3>
              <button onClick={() => setShowPaymentModal(false)} disabled={isProcessingPayment} className="text-gray-400 hover:text-red-500 text-3xl font-bold transition">&times;</button>
            </div>
            
            <form onSubmit={executeCheckout} className="p-6">
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Amount Due</p>
                <p className="text-4xl font-black text-blue-600">৳{totalPrice.toFixed(2)}</p>
              </div>

              <div className="space-y-3 mb-8">
                <label className="block text-sm font-bold text-gray-800 mb-2">Select Payment Method</label>
                
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'Cash On Delivery' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value="Cash On Delivery" checked={paymentMethod === 'Cash On Delivery'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600" />
                  <span className="ml-3 font-bold text-gray-800 flex-1">Cash On Delivery</span>
                  <span className="text-xl">💵</span>
                </label>
                
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'bKash' ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value="bKash" checked={paymentMethod === 'bKash'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-pink-600" />
                  <span className="ml-3 font-bold text-gray-800 flex-1">bKash Instapay</span>
                  <span className="text-xl">📱</span>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'Card' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-purple-600" />
                  <span className="ml-3 font-bold text-gray-800 flex-1">Credit / Debit Card</span>
                  <span className="text-xl">💳</span>
                </label>
              </div>

              {paymentMethod !== 'Cash On Delivery' ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm text-blue-800 font-bold text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Fast and secure. Your payment will be processed instantly via {paymentMethod}.
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <p className="text-sm text-yellow-800 font-bold text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Please keep exact change ready. Payment will be collected by our delivery rider.
                  </p>
                </div>
              )}

              <button type="submit" disabled={isProcessingPayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition disabled:opacity-50">
                {isProcessingPayment ? 'Processing Securely...' : `Confirm & Pay ৳${totalPrice.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
