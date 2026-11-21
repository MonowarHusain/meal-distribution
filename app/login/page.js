"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        const role = (data.role || data.user?.role || data.user?.Role || 'customer').toLowerCase();
        const userId = data.id || data.user?.id || 1;

        localStorage.setItem('user', JSON.stringify({
          Email: email,
          Role: role,
          id: userId,
          name: data.user?.name || email.split('@')[0]
        }));
        localStorage.setItem('role', role);
        localStorage.setItem('userName', email.split('@')[0]);
        
        if (role === 'admin') window.location.href = '/admin';
        else if (role === 'kitchen') window.location.href = '/kitchen';
        else if (role === 'delivery') window.location.href = '/delivery';
        else window.location.href = '/customer';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-8">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-black mb-2 text-center text-slate-900">Meal System Login</h1>
        <p className="text-xs text-slate-600 font-medium text-center mb-6">Enter your registered email and password</p>

        {error && <p className="text-red-700 bg-red-50 border border-red-300 text-sm p-3 rounded-xl mb-4 text-center font-bold">{error}</p>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email</label>
            <input 
              type="email" placeholder="e.g. admin@meal.com" required
              className="w-full p-3.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" placeholder="••••••••" required
              className="w-full p-3.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-2.5">Demo Credentials (Password: admin123 / kitchen123)</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button type="button" onClick={() => fillDemo('admin@meal.com', 'admin123')} className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-800 rounded-xl border border-slate-200 transition text-center shadow-xs cursor-pointer">
              Admin
            </button>
            <button type="button" onClick={() => fillDemo('kitchen@meal.com', 'kitchen123')} className="p-2.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 text-slate-800 rounded-xl border border-slate-200 transition text-center shadow-xs cursor-pointer">
              Kitchen
            </button>
            <button type="button" onClick={() => fillDemo('delivery@meal.com', 'delivery123')} className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-800 rounded-xl border border-slate-200 transition text-center shadow-xs cursor-pointer">
              Delivery
            </button>
            <button type="button" onClick={() => fillDemo('customer@meal.com', 'customer123')} className="p-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 text-slate-800 rounded-xl border border-slate-200 transition text-center shadow-xs cursor-pointer">
              Customer
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-slate-600 font-medium">
          New user? <Link href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-bold ml-1">Sign Up</Link>
        </div>
      </form>
    </div>
  );
}
