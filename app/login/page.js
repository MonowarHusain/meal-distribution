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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-black mb-2 text-center text-gray-900">Meal System Login</h1>
        <p className="text-xs text-gray-400 text-center mb-6">Enter your registered email and password</p>

        {error && <p className="text-red-500 bg-red-50 border border-red-200 text-sm p-3 rounded-lg mb-4 text-center font-bold">{error}</p>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Email</label>
            <input 
              type="email" placeholder="e.g. admin@meal.com" required
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Password</label>
            <input 
              type="password" placeholder="••••••••" required
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-bold uppercase text-gray-400 text-center mb-2">Demo Credentials (Password: admin123 / kitchen123)</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button type="button" onClick={() => fillDemo('admin@meal.com', 'admin123')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border text-center">
              Admin
            </button>
            <button type="button" onClick={() => fillDemo('kitchen@meal.com', 'kitchen123')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border text-center">
              Kitchen
            </button>
            <button type="button" onClick={() => fillDemo('delivery@meal.com', 'delivery123')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border text-center">
              Delivery
            </button>
            <button type="button" onClick={() => fillDemo('customer@meal.com', 'customer123')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border text-center">
              Customer
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500 font-medium">
          New user? <Link href="/signup" className="text-blue-600 hover:underline font-bold">Sign Up</Link>
        </div>
      </form>
    </div>
  );
}
