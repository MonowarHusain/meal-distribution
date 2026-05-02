"use client";
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();

    if (data.success) {
      // Save user info for the session
      localStorage.setItem('user', JSON.stringify({ Email: email, Role: data.role, id: data.id }));
      
      // Automatic Role Redirection
      const role = data.role;
      if (role === 'admin') window.location.href = '/admin';
      else if (role === 'kitchen') window.location.href = '/kitchen';
      else if (role === 'delivery') window.location.href = '/delivery';
      else window.location.href = '/customer'; // User1 & User2
    } else {
      alert("Invalid login. Try admin@mail.com / pass123");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Meal System</h1>
          <p className="text-gray-500 mt-2">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. admin@mail.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition duration-200">
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          Demo: Admin, Kitchen, Del1, User1 (Pass: pass123)
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500 font-medium">
          Don't have an account? <a href="/signup" className="text-blue-600 hover:underline font-bold">Sign Up</a>
        </div>
      </div>
    </main>
  );
}
