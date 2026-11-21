"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', house: '', road: '', street: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        setError(data.message || 'Failed to register account');
      }
    } catch {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-blue-50 text-3xl rounded-2xl mb-2 shadow-sm border border-blue-100">📝</div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">Join the Meal Distribution Network</p>
        </div>

        {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm font-bold text-center">{error}</div>}
        {success && <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold text-center">Registration successful! Redirecting to login...</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name</label>
            <input 
              type="text" required
              value={formData.name}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="e.g. Tanvir Ahmed"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
            <input 
              type="email" required
              value={formData.email}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="e.g. tanvir@meal.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Phone Number</label>
            <input 
              type="text" required
              value={formData.phone}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="e.g. 01700000000"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">House</label>
              <input 
                type="text"
                value={formData.house}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="42B"
                onChange={(e) => setFormData({...formData, house: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Road</label>
              <input 
                type="text"
                value={formData.road}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="7"
                onChange={(e) => setFormData({...formData, road: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Street/Area</label>
              <input 
                type="text"
                value={formData.street}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="Banani"
                onChange={(e) => setFormData({...formData, street: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" required
              value={formData.password}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || success} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition duration-200 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600 font-medium">
          Already have an account? <Link href="/" className="text-blue-600 hover:text-blue-700 hover:underline font-bold ml-1">Sign In</Link>
        </div>
      </div>
    </main>
  );
}
