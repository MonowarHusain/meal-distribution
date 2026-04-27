"use client";

export default function KitchenDashboard() {
  return (
    <main className="p-8 max-w-4xl mx-auto font-sans">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-orange-600">Kitchen Dashboard</h1>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          className="text-red-500 font-bold hover:underline"
        >
          Logout
        </button>
      </header>
      
      {/* Placeholder for orders list */}
      <div className="mb-8">
        <p className="text-gray-600">Orders list will appear here.</p>
      </div>

      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Manage Menu Items</h2>
        <button onClick={async () => {
          const name = prompt("Item Name?");
          const price = prompt("Price?");
          const type = prompt("Regular or Premium?");
          await fetch('/api/menu', {
            method: 'POST',
            body: JSON.stringify({ name, price, type })
          });
          window.location.reload();
        }} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">+ Add New Item</button>
      </div>
    </main>
  );
}
