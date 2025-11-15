import React from "react";
import { SignInButton } from "@clerk/clerk-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#fffaf0] to-white text-center p-8">
      <div className="text-5xl mb-4">🚫</div>
      <h1 className="text-3xl font-bold text-[#b8860b] mb-2">Access Denied</h1>
      <p className="text-gray-700 mb-6 max-w-md">
        Sorry, you don’t have permission to view this page.  
        Please sign in with an authorized admin account or return to the home page.
      </p>
      <div className="flex gap-4">
        <a
          href="/"
          className="px-4 py-2 bg-[#b8860b] text-white rounded-lg shadow hover:bg-[#a6760a] transition"
        >
          Go to Home
        </a>
        <SignInButton mode="modal">
          <button className="px-4 py-2 border border-[#b8860b] text-[#b8860b] rounded-lg hover:bg-[#fff5e1] transition">
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
