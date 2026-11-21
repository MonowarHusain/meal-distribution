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

        // Save session details
        localStorage.setItem('user', JSON.stringify({
          Email: email,
          Role: role,
          id: userId,
          name: data.user?.name || email.split('@')[0]
        }));
        localStorage.setItem('role', role);

        // Automatic Role Redirection
        if (role === 'admin') window.location.href = '/admin';
        else if (role === 'kitchen') window.location.href = '/kitchen';
        else if (role === 'delivery') window.location.href = '/delivery';
        else window.location.href = '/customer';
      } else {
        setError(data.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch {
      setError('Unable to reach server. Please check your network connection.');
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
    <main className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-50 text-3xl rounded-2xl mb-3">🍱</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Meal System</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your role-based dashboard</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Email Address</label>
            <input 
              type="email" required
              value={email}
              className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
              placeholder="e.g. admin@meal.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Password</label>
            <input 
              type="password" required
              value={password}
              className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition duration-200 disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center mb-3">Quick Demo Logins</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button type="button" onClick={() => fillDemo('admin@meal.com', 'admin123')} className="p-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-gray-200 transition text-center">
              👑 Admin
            </button>
            <button type="button" onClick={() => fillDemo('kitchen@meal.com', 'kitchen123')} className="p-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-lg border border-gray-200 transition text-center">
              🍳 Kitchen
            </button>
            <button type="button" onClick={() => fillDemo('delivery@meal.com', 'delivery123')} className="p-2 bg-gray-50 hover:bg-green-50 hover:text-green-600 rounded-lg border border-gray-200 transition text-center">
              🛵 Delivery
            </button>
            <button type="button" onClick={() => fillDemo('customer@meal.com', 'customer123')} className="p-2 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 rounded-lg border border-gray-200 transition text-center">
              🍱 Customer
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-sm text-gray-500 font-medium">
          Don&apos;t have an account? <Link href="/signup" className="text-blue-600 hover:underline font-bold">Create Account</Link>
        </div>
      </div>
    </main>
  );
}
