"use client";
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (email.includes('admin')) {
      localStorage.setItem('role', 'admin');
      window.location.href = '/admin';
    } else if (email.includes('kitchen')) {
      localStorage.setItem('role', 'kitchen');
      window.location.href = '/kitchen';
    } else {
      localStorage.setItem('role', 'customer');
      localStorage.setItem('userName', email.split('@')[0]);
      window.location.href = '/';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">Meal System Login</h1>
        <input 
          type="email" placeholder="Email" required
          className="w-full p-2 border rounded mb-4"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input type="password" placeholder="Password" className="w-full p-2 border rounded mb-4" defaultValue="pass123"/>
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        <p className="text-xs text-gray-500 mt-4 text-center">Hint: Use 'admin@...' or 'kitchen@...' to test roles.</p>
      </form>
    </div>
  );
}
