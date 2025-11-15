import React, { useState } from 'react';
import { FaInstagram, FaWhatsapp, FaTiktok } from 'react-icons/fa';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitSuccess(null);
    setSubmitError(null);

    // Basic client validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitError('Please fill in all fields.');
      return;
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to send message. Please try again later.');
      }

      setSubmitSuccess('Your message was sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-6 mt-8 bg-[#FAF3E0] text-[#3E2C23] min-h-screen font-serif max-w-5xl mx-auto">
      <h1 className="font-heading text-4xl mb-8 text-[#E6A52D] text-center tracking-wide">
        Contact Us
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-[#b8860b]"
          noValidate
        >
          <label htmlFor="name" className="block font-semibold mb-1">
            Name
          </label>
          <input
            id="name"
            name="name"
            onChange={handleChange}
            value={formData.name}
            placeholder="Your name"
            required
            className="w-full p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            disabled={submitting}
          />

          <label htmlFor="email" className="block font-semibold mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            onChange={handleChange}
            value={formData.email}
            placeholder="your.email@example.com"
            required
            className="w-full p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
            disabled={submitting}
          />

          <label htmlFor="message" className="block font-semibold mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            onChange={handleChange}
            value={formData.message}
            placeholder="Write your message here..."
            required
            className="w-full p-3 border border-[#b8860b] rounded-lg h-32 resize-none focus:outline-none focus:border-[#ff8c00] transition"
            disabled={submitting}
          />

          {submitSuccess && (
            <p className="text-green-600 font-semibold">{submitSuccess}</p>
          )}
          {submitError && (
            <p className="text-red-600 font-semibold">{submitError}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#b8860b] hover:bg-[#997500] text-white rounded font-semibold transition"
            disabled={submitting}
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </form>

        {/* Physical location and social links */}
        <div>
          <h2 className="font-heading text-2xl mb-4 text-[#E6A52D]">Our Location</h2>
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-md mb-8 border border-[#b8860b]">
            <iframe
              src="https://maps.google.com/maps?q=nairobi&t=&z=13&ie=UTF8&iwloc=&output=embed"
              title="Physical Location Map"
              className="w-full h-full"
              allowFullScreen
            ></iframe>
          </div>

          <h2 className="font-heading text-2xl mb-4 text-[#E6A52D]">Follow Us</h2>
          <div className="flex space-x-6 text-[#b8860b] text-3xl">
            <a
              href="https://www.instagram.com/byluciejewelry"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-[#ff5000] transition-colors"
            >
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hover:text-[#ff5000] transition-colors"
            >
              <FaWhatsapp />
            </a>
            <a
              href="https://www.tiktok.com/@byluciejewelry"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="hover:text-[#ff5000] transition-colors"
            >
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
