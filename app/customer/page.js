"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'orders', 'profile', 'reviews'
  const [menuItems, setMenuItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cart States
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerId] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          if (userObj.id) return userObj.id;
        }
      } catch {}
    }
    return 1;
  });
  
  // Review States
  const [myReviews, setMyReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewItem, setCurrentReviewItem] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
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

  // Fetch Menu
  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenuItems(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch Order History & Profile
  useEffect(() => {
    const loadData = () => {
      if (activeTab === 'orders') {
        fetch(`/api/customer/orders?customerId=${customerId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) setOrderHistory(data.orders || []);
            setLoading(false);
          }).catch(() => setLoading(false));
      } else if (activeTab === 'profile') {
        fetch(`/api/customer/profile?customerId=${customerId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) setProfile(data.profile || {});
            setLoading(false);
          }).catch(() => setLoading(false));
      } else if (activeTab === 'reviews') {
        fetch(`/api/customer/reviews?customerId=${customerId}&type=history`)
          .then(res => res.json())
          .then(data => {
            if (data.success) setMyReviews(data.data || []);
            setLoading(false);
          }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    };
    
    const loadPendingReviews = () => {
      if (!showReviewModal) {
        const snoozedUntil = localStorage.getItem('reviewSnoozedUntil');
        if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) {
          return;
        }
        
        fetch(`/api/customer/reviews?customerId=${customerId}&type=pending`)
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
              setCurrentReviewItem(data.data[0]);
              setShowReviewModal(true);
            }
          }).catch(() => {});
      }
    };
    
    loadData();
    loadPendingReviews();
    const interval = setInterval(() => { loadData(); loadPendingReviews(); }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, customerId, showReviewModal]);

  // Cart Functions
  const addToCart = (item) => {
    const itemId = item.MenuItemID || item.menuitemid;
    setCart((prev) => {
      const existing = prev.find(i => (i.MenuItemID === itemId || i.menuitemid === itemId));
      if (existing) {
        return prev.map(i => (i.MenuItemID === itemId || i.menuitemid === itemId) ? { ...i, Quantity: i.Quantity + 1 } : i);
      }
      return [...prev, { ...item, Quantity: 1 }];
    });
    setIsCartOpen(true);
  };
  const increment = (id) => setCart(prev => prev.map(i => (i.MenuItemID === id || i.menuitemid === id) ? { ...i, Quantity: i.Quantity + 1 } : i));
  const decrement = (id) => setCart(prev => prev.map(i => (i.MenuItemID === id || i.menuitemid === id) ? { ...i, Quantity: Math.max(1, i.Quantity - 1) } : i));
  const remove = (id) => setCart(prev => prev.filter(i => (i.MenuItemID !== id && i.menuitemid !== id)));
  const totalPrice = cart.reduce((sum, item) => sum + (parseFloat(item.Price || item.price || 0) * item.Quantity), 0);

  // Checkout & Payment
  const triggerPayment = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
    setIsCartOpen(false);
  };

  const executeCheckout = async (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    const orderData = {
      customerId: customerId,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      items: cart.map(item => ({ menuItemId: item.MenuItemID || item.menuitemid, quantity: item.Quantity }))
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
        alert(result.message || 'Failed to place order.');
      }
    } catch {
      alert('Error connecting to server. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          name: profile.Name || profile.name,
          phone: profile.Phone || profile.phone,
          street: profile.Street || profile.street,
          road: profile.Road || profile.road,
          house: profile.House || profile.house
        })
      });
      const data = await res.json();
      if (data.success) alert("Profile updated successfully!");
      else alert("Failed to update profile.");
    } catch {
      alert("Network error.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const dismissReviewPrompt = () => {
    setShowReviewModal(false);
    localStorage.setItem('reviewSnoozedUntil', Date.now() + 24 * 60 * 60 * 1000);
  };

  // Review Submitting
  const submitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          menuItemId: currentReviewItem.MenuItemID || currentReviewItem.menuitemid,
          orderId: currentReviewItem.OrderID || currentReviewItem.orderid,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Review submitted! Thank you.");
        setShowReviewModal(false);
        setReviewData({ rating: 5, comment: '' });
        
        // Refresh menu to update average ratings immediately
        if (activeTab === 'menu') {
          fetch('/api/menu').then(r => r.json()).then(d => setMenuItems(d.data || []));
        }
      } else {
        alert(data.message || "Failed to submit review.");
      }
    } catch {
      alert("Error submitting review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Order Details
  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails(null);
    try {
      const orderId = order.OrderID || order.orderid;
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) setOrderDetails(data);
    } catch (e) {
      console.error("Details fetch error:", e);
    }
  };

  // UI Helpers
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Kitchen_Accepted': return 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      case 'Cooking_Done': return 'bg-orange-100 text-orange-900 border-orange-300 font-bold';
      case 'Dispatched': return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'Delivered': return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'Refused': return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
      default: return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
    }
  };

  return (
    <main className="p-8 max-w-5xl mx-auto font-sans relative pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Customer Dashboard</h1>
          <div className="flex gap-6 mt-4">
            {['menu', 'orders', 'profile', 'reviews'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-bold pb-2 border-b-2 transition capitalize cursor-pointer ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
              >
                {tab === 'menu' ? 'Order Menu' : tab === 'orders' ? 'My Orders' : tab === 'profile' ? 'My Profile' : 'My Reviews'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {activeTab === 'menu' && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-slate-100 text-slate-800 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition border border-slate-200 cursor-pointer shadow-xs"
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
            className="bg-red-50 text-red-700 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition border border-red-200 text-sm cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {loading && <div className="text-center py-12 text-xl font-bold text-slate-600 animate-pulse">Loading data...</div>}

      {/* MENU TAB */}
      {!loading && activeTab === 'menu' && (
        <>
          {menuItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 shadow-xs">
              <div className="text-4xl mb-3">🍲</div>
              <h3 className="text-xl font-bold text-slate-800">No menu items available right now</h3>
              <p className="text-slate-600 text-sm mt-1 font-medium">Please check back soon or run database initialization.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => {
                const id = item.MenuItemID || item.menuitemid;
                const name = item.Name || item.name;
                const price = item.Price || item.price;
                const type = item.Item_Type || item.item_type;
                const rating = item.AvgRating || item.avgrating || 0;
                const count = item.ReviewCount || item.reviewcount || 0;
                return (
                  <div key={id} className="border border-slate-200 p-5 rounded-2xl shadow-xs relative bg-white hover:shadow-md transition">
                    <span className="absolute top-3 right-3 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-bold border border-slate-200">
                      {(type === 'Premium' ? 'P' : 'R') + String(id).padStart(3, '0')}
                    </span>
                    <div className="text-4xl mb-4">{type === 'Premium' ? '⭐' : '🍲'}</div>
                    <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                    <div className="flex items-center gap-2 mt-1 mb-2">
                       <span className="text-yellow-600 font-black">⭐ {parseFloat(rating).toFixed(1)}</span>
                       <span className="text-xs text-slate-600 font-bold">({count} reviews)</span>
                    </div>
                    <span className={`inline-block mb-4 text-xs font-bold px-2.5 py-1 rounded-md border ${type === 'Premium' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                      {type}
                    </span>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                      <span className="text-2xl font-black text-slate-900">৳{price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition transform hover:-translate-y-0.5 shadow-md cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MY ORDERS TAB */}
      {!loading && activeTab === 'orders' && (
        <div className="space-y-4">
          {orderHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-600 font-bold bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-xs">
              You haven&apos;t placed any orders yet.
            </div>
          ) : (
            orderHistory.map(order => {
              const id = order.OrderID || order.orderid;
              const orderNum = order.Order_Number || order.order_number;
              const status = order.Status || order.status || 'Pending';
              const orderDate = order.Order_Date || order.order_date;
              const totalPrice = order.Total_Price || order.total_price;
              return (
                <div key={id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-slate-900 text-xl">Order #{orderNum}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <p suppressHydrationWarning className="text-sm text-slate-600 font-medium">
                      Placed on: {new Date(orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-slate-600 font-black uppercase tracking-wider mb-0.5">Total Paid</p>
                      <p className="font-black text-slate-900 text-2xl">৳{totalPrice}</p>
                    </div>
                    <button 
                      onClick={() => viewOrderDetails(order)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-bold border border-slate-200 transition cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MY PROFILE TAB */}
      {!loading && activeTab === 'profile' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xs p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Personal & Delivery Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input required type="text" value={profile.Name || profile.name || ''} onChange={e => setProfile({...profile, Name: e.target.value, name: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <input required type="text" value={profile.Phone || profile.phone || ''} onChange={e => setProfile({...profile, Phone: e.target.value, phone: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 font-medium" />
              </div>
            </div>
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">House</label>
                  <input type="text" value={profile.House || profile.house || ''} onChange={e => setProfile({...profile, House: e.target.value, house: e.target.value})} placeholder="e.g. 42B" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Road</label>
                  <input type="text" value={profile.Road || profile.road || ''} onChange={e => setProfile({...profile, Road: e.target.value, road: e.target.value})} placeholder="e.g. 7" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Street/Area</label>
                  <input type="text" value={profile.Street || profile.street || ''} onChange={e => setProfile({...profile, Street: e.target.value, street: e.target.value})} placeholder="e.g. Mohakhali" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 font-medium" />
                </div>
              </div>
            </div>
            <button disabled={isSavingProfile} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 mt-4 shadow-md hover:shadow-lg cursor-pointer">
              {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      )}

      {/* MY REVIEWS TAB */}
      {!loading && activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl mb-6 shadow-xs">
            <h2 className="text-xl font-black text-blue-900 mb-1">Your Feedback Matters!</h2>
            <p className="text-blue-700 font-semibold text-sm">Review past orders to help others make better choices.</p>
          </div>
          {myReviews.length === 0 ? (
             <div className="text-center py-12 text-slate-600 font-bold bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-xs">
               You haven&apos;t left any reviews yet. Complete an order to leave a review!
             </div>
          ) : (
             myReviews.map(review => {
               const id = review.ReviewID || review.reviewid;
               const name = review.Name || review.name;
               const rating = review.Rating || review.rating || 5;
               const comment = review.Comment || review.comment;
               const orderNum = review.Order_Number || review.order_number;
               const createdAt = review.CreatedAt || review.createdat;
               return (
                 <div key={id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row gap-6 hover:shadow-md transition">
                   <div className="flex-1">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
                       <span className="text-yellow-600 font-black tracking-widest">{'⭐'.repeat(rating)}</span>
                     </div>
                     <p className="text-sm text-slate-800 italic mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200">&ldquo;{comment || 'No comment provided.'}&rdquo;</p>
                     <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">From Order #{orderNum} • {new Date(createdAt).toLocaleDateString()}</p>
                   </div>
                 </div>
               );
             })
          )}
        </div>
      )}

      {/* Review Prompt Modal */}
      {showReviewModal && currentReviewItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⭐</div>
              <h3 className="font-black text-2xl text-slate-900 mb-1 relative z-10">How was your food?</h3>
              <p className="text-sm text-slate-600 font-medium relative z-10">Your order has been delivered!</p>
              <button onClick={dismissReviewPrompt} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 text-3xl font-bold transition z-20 cursor-pointer">&times;</button>
            </div>
            
            <form onSubmit={submitReview} className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                 <div className="w-16 h-16 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center text-3xl">🍲</div>
                 <div>
                   <h4 className="font-bold text-slate-900 text-lg">{currentReviewItem.Name || currentReviewItem.name}</h4>
                   <p className="text-xs font-bold text-blue-700 uppercase">Order Ref #{currentReviewItem.OrderID || currentReviewItem.orderid}</p>
                 </div>
              </div>

              <div className="mb-6 text-center">
                <label className="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Tap to Rate</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-4xl transition-transform hover:scale-110 active:scale-95 cursor-pointer ${reviewData.rating >= star ? 'text-yellow-500' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-600">
                  {reviewData.rating === 5 ? 'Excellent!' : reviewData.rating === 4 ? 'Good' : reviewData.rating === 3 ? 'Okay' : reviewData.rating === 2 ? 'Poor' : 'Terrible'}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-800 mb-2">Leave a comment (Optional)</label>
                <textarea 
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="What did you like or dislike?"
                  className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none h-24 bg-slate-50 focus:bg-white transition text-slate-900 font-medium"
                ></textarea>
              </div>

              <button type="submit" disabled={isSubmittingReview} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer">
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
              
              <button type="button" onClick={dismissReviewPrompt} className="w-full mt-3 py-3 text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer">
                Remind me later
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-2xl text-slate-900">Order #{selectedOrder.Order_Number || selectedOrder.order_number}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedOrder.Status || selectedOrder.status)}`}>
                  {(selectedOrder.Status || selectedOrder.status || '').replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-red-600 text-3xl font-bold transition cursor-pointer">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!orderDetails ? (
                <div className="text-center py-8 text-slate-600 font-bold animate-pulse">Loading order details...</div>
              ) : (
                <div className="space-y-6">
                  {/* Items List */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Items Ordered</h4>
                    <div className="space-y-3">
                      {(orderDetails.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-blue-700 bg-blue-100 border border-blue-200 w-8 h-8 flex items-center justify-center rounded-lg">{item.Quantity || item.quantity}x</span>
                            <span className="font-bold text-slate-900">{item.Name || item.name}</span>
                          </div>
                          <span className="font-black text-slate-900">৳{item.Subtotal || item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 pt-4 border-t border-slate-200">Order Timeline</h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-300 before:to-transparent">
                      {(orderDetails.timeline || []).map((event, idx) => (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                            <div className="font-bold text-slate-900 text-sm mb-1">{(event.Status || event.status || '').replace('_', ' ')}</div>
                            <time suppressHydrationWarning className="block text-xs font-semibold text-slate-500">
                              {new Date(event.Status_Date || event.status_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' })} - {new Date(event.Status_Date || event.status_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </time>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
               <span className="font-bold text-slate-600 uppercase tracking-wider text-sm">Total Paid</span>
               <span className="font-black text-3xl text-blue-700">৳{selectedOrder.Total_Price || selectedOrder.total_price}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar Overlay */}
      {isCartOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />}
      
      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-black text-slate-900">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-red-600 font-bold text-3xl transition cursor-pointer">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {cart.length === 0 ? (
             <div className="text-center text-slate-600 mt-10 font-bold">Your cart is empty.</div>
          ) : (
            cart.map(item => {
              const id = item.MenuItemID || item.menuitemid;
              const name = item.Name || item.name;
              const price = item.Price || item.price;
              return (
                <div key={id} className="flex gap-4 items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{name}</h3>
                    <div className="text-blue-700 font-black text-sm">৳{price}</div>
                    <div className="flex items-center gap-3 mt-2 bg-slate-50 w-fit rounded-lg border border-slate-300">
                      <button onClick={() => decrement(id)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-slate-700 font-black transition rounded-l-lg cursor-pointer">-</button>
                      <span className="font-bold text-slate-900 w-4 text-center text-sm">{item.Quantity}</span>
                      <button onClick={() => increment(id)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-slate-700 font-black transition rounded-r-lg cursor-pointer">+</button>
                    </div>
                  </div>
                  <button onClick={() => remove(id)} className="text-red-500 hover:text-red-700 p-2 transition bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer">✕</button>
                </div>
              );
            })
          )}
        </div>
        <div className="p-6 border-t border-slate-200 bg-white shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg text-slate-600 font-bold">Total Amount:</span>
            <span className="text-3xl font-black text-blue-700">৳{totalPrice.toFixed(2)}</span>
          </div>
          <button onClick={triggerPayment} disabled={cart.length === 0} className={`w-full py-4 rounded-xl font-black text-lg transition-all cursor-pointer ${cart.length === 0 ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}>
            Proceed to Payment
          </button>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-2xl text-slate-900">Secure Checkout</h3>
              <button onClick={() => setShowPaymentModal(false)} disabled={isProcessingPayment} className="text-slate-400 hover:text-red-600 text-3xl font-bold transition cursor-pointer">&times;</button>
            </div>
            
            <form onSubmit={executeCheckout} className="p-6">
              <div className="mb-6 text-center">
                <p className="text-sm text-slate-600 font-bold uppercase tracking-wider mb-1">Total Amount Due</p>
                <p className="text-4xl font-black text-blue-700">৳{totalPrice.toFixed(2)}</p>
              </div>

              <div className="space-y-3 mb-8">
                <label className="block text-sm font-bold text-slate-800 mb-2">Select Payment Method</label>
                
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'Cash On Delivery' ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <input type="radio" name="payment" value="Cash On Delivery" checked={paymentMethod === 'Cash On Delivery'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600" />
                  <span className="ml-3 font-bold text-slate-900 flex-1">Cash On Delivery</span>
                  <span className="text-xl">💵</span>
                </label>
                
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'bKash' ? 'border-pink-600 bg-pink-50/70 ring-2 ring-pink-500/30' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <input type="radio" name="payment" value="bKash" checked={paymentMethod === 'bKash'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-pink-600" />
                  <span className="ml-3 font-bold text-slate-900 flex-1">bKash Instapay</span>
                  <span className="text-xl">📱</span>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'Card' ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/30' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-purple-600" />
                  <span className="ml-3 font-bold text-slate-900 flex-1">Credit / Debit Card</span>
                  <span className="text-xl">💳</span>
                </label>
              </div>

              {paymentMethod !== 'Cash On Delivery' ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-950 font-bold text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Fast and secure. Your payment will be processed instantly via {paymentMethod}.
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-950 font-bold text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Please keep exact change ready. Payment will be collected by our delivery rider.
                  </p>
                </div>
              )}

              <button type="submit" disabled={isProcessingPayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer">
                {isProcessingPayment ? 'Processing Securely...' : `Confirm & Pay ৳${totalPrice.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
