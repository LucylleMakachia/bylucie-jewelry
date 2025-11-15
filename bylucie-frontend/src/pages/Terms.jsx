import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-md border border-[#b8860b] mt-16">
      <h1 className="text-3xl font-bold mb-6 text-[#b8860b]">Terms & Conditions</h1>
      <p className="mb-6 text-gray-700">
        Welcome to our website. These terms and conditions outline the rules and regulations for the use of our website.
      </p>
      <h2 className="text-xl font-semibold mb-2 text-[#b8860b]">Intellectual Property Rights</h2>
      <p className="mb-6 text-gray-700">
        Other than content you own, under these Terms, we own all the intellectual property rights and materials contained in this website.
      </p>
      <h2 className="text-xl font-semibold mb-2 text-[#b8860b]">Restrictions</h2>
      <ul className="list-disc list-inside mb-6 text-gray-700">
        <li>You are specifically restricted from publishing any website material in any other media without prior permission.</li>
        <li>You must not sell, rent or sub-license material from the website.</li>
        <li>You must not reproduce, duplicate or copy content for commercial use.</li>
      </ul>
      <h2 className="text-xl font-semibold mb-2 text-[#b8860b]">Your Content</h2>
      <p className="mb-6 text-gray-700">
        Your content must not be illegal, offensive, threatening or harmful and must not infringe on any third party rights.
      </p>
      <h2 className="text-xl font-semibold mb-2 text-[#b8860b]">Limitation of Liability</h2>
      <p className="text-gray-700">
        To the maximum extent permitted by law, we will not be liable for any damages arising out of or in connection with your use of this website.
      </p>
    </div>
  );
}
