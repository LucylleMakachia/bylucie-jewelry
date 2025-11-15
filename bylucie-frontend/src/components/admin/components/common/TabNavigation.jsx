import React from 'react';

function TabNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'products', label: 'Products', icon: '🛍️' },
    { id: 'analytics', label: 'Reports', icon: '📈' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
  ];

  return (
    <nav className="flex space-x-3 mb-8 bg-gradient-to-r from-white to-gray-50 p-3 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
            activeTab === tab.id 
              ? 'bg-gradient-to-r from-[#b8860b] to-[#daa520] text-white shadow-lg' 
              : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default TabNavigation;