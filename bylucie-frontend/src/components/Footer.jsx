import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#002200] text-[#ffc200] font-serif py-12 px-6 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        {/* Brand and About */}
        <div className="flex flex-col max-w-sm space-y-4">
          <h2 className="text-2xl font-bold tracking-wider text-[#b8860b]">ByLucie Jewelry</h2>
          <p className="text-sm text-[#ffd700]">
            Crafted in Kenya with passion and heritage. Handcrafted luxury jewelry celebrating local artisans and timeless beauty.
          </p>
          <p className="text-xs text-[#b8860b]">&copy; 2025 ByLucie Jewelry. All rights reserved.</p>
        </div>

        {/* Contact */}
        <div className="flex flex-col space-y-2 text-sm">
          <h3 className="font-semibold text-[#b8860b] tracking-wide">Contact Us</h3>
          <a href="mailto:support@byluciejewelry.com" className="hover:text-[#ff5000] transition-colors">
            support@byluciejewelry.com
          </a>
          <a href="tel:+254700000000" className="hover:text-[#ff5000] transition-colors">
            +254 700 000 000
          </a>
          <address className="not-italic text-[#ffd700]">
            Nairobi, Kenya
          </address>
        </div>

        {/* Social and Newsletter */}
        <div className="flex flex-col space-y-4 max-w-xs">
          <div>
            <h3 className="font-semibold text-[#b8860b] tracking-wide mb-2">Follow Us</h3>
            <div className="flex space-x-6 text-[#ffc200]">
              <a
                href="https://www.instagram.com/byluciejewelry"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#ff5000] transition-colors"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/byluciejewelry"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#ff5000] transition-colors"
                aria-label="Facebook"
              >
                Facebook
              </a>
              <a
                href="https://www.x.com/bylucie"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#ff5000] transition-colors"
                aria-label="X"
              >
                X
              </a>
            </div>
          </div>
          <form className="flex flex-col space-y-2">
            <label htmlFor="newsletter-email" className="font-semibold text-[#b8860b]">
              Subscribe to our newsletter
            </label>
            <div className="flex">
              <input
                type="email"
                id="newsletter-email"
                placeholder="Your email address"
                className="flex-1 rounded-l bg-[#003300] px-4 py-2 text-[#ffd700] focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
              />
              <button
                type="submit"
                className="bg-[#b8860b] px-4 py-2 rounded-r text-[#002200] font-semibold hover:bg-[#ffb84d] transition-colors"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </footer>
  );
}
