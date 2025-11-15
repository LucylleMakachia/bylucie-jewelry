import React from "react";

export default function UnauthorizedMessage() {
  return (
    <div className="min-h-screen bg-[#fffaf0] flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-md border border-[#b8860b]/30">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-[#b8860b] mb-4">Access Denied</h1>
        <p className="text-gray-700 mb-6">
          You don’t have permission to access the admin dashboard.  
          Please contact your site administrator if you believe this is an error.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-2 bg-[#b8860b] text-white rounded-md hover:bg-[#a6760a] transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
