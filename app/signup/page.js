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
    <main className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-blue-50 text-3xl rounded-2xl mb-2">📝</div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the Meal Distribution Network</p>
        </div>

        {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold text-center">{error}</div>}
        {success && <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-bold text-center">Registration successful! Redirecting to login...</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Full Name</label>
            <input 
              type="text" required
              value={formData.name}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. Tanvir Ahmed"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Email Address</label>
            <input 
              type="email" required
              value={formData.email}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. tanvir@meal.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Phone Number</label>
            <input 
              type="text" required
              value={formData.phone}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. 01700000000"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">House</label>
              <input 
                type="text"
                value={formData.house}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="42B"
                onChange={(e) => setFormData({...formData, house: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Road</label>
              <input 
                type="text"
                value={formData.road}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="7"
                onChange={(e) => setFormData({...formData, road: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Street/Area</label>
              <input 
                type="text"
                value={formData.street}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Banani"
                onChange={(e) => setFormData({...formData, street: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Password</label>
            <input 
              type="password" required
              value={formData.password}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || success} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition duration-200 mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500 font-medium">
          Already have an account? <Link href="/" className="text-blue-600 hover:underline font-bold">Sign In</Link>
        </div>
      </div>
    </main>
  );
}
