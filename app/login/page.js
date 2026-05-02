"use client";
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('pass123');
  const [error, setError] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        const role = data.user.Role.toLowerCase();
        localStorage.setItem('role', role);
        localStorage.setItem('userName', email.split('@')[0]);
        
        if (role === 'admin') window.location.href = '/admin';
        else if (role === 'kitchen') window.location.href = '/kitchen';
        else if (role === 'delivery') window.location.href = '/delivery';
        else window.location.href = '/';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">Meal System Login</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <input 
          type="email" placeholder="Email" required
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" placeholder="Password" required
          className="w-full p-2 border rounded mb-4" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        <p className="text-xs text-gray-500 mt-4 text-center">Hint: Use 'admin@...', 'kitchen@...' or 'del@...' to test roles.</p>
      </form>
    </div>
  );
}
