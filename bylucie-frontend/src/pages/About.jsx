import React, { useEffect, useState } from 'react';

export default function About() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await fetch('/api/pages/about');
        if (!res.ok) {
          throw new Error('Failed to fetch about page content');
        }
        const html = await res.text();
        setContent(html);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAbout();
  }, []);

  if (loading)
    return <p className="p-6 text-center text-[#b8860b] font-semibold">Loading about page...</p>;
  if (error)
    return <p className="p-6 text-center text-red-600 font-semibold">Error: {error}</p>;

  return (
    <main className="p-6 bg-[#FAF3E0] text-[#213547] min-h-screen font-serif mt-8 max-w-5xl mx-auto">
      <h1 className="font-heading text-4xl mb-8 text-[#E6A52D] text-center tracking-wide">
        Our Story
      </h1>
      <div
        className="mb-8 text-lg text-center"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* The following can be included in the backend HTML or kept here if you want static */}
      {/* Artisans and workspace images */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="overflow-hidden rounded-lg shadow-lg">
          <img
            src="/images/inspo.jpg"
            alt="Artisan workspace"
            className="w-full h-64 object-cover hover:scale-105 transform transition-transform duration-300"
          />
        </div>
        <div className="overflow-hidden rounded-lg shadow-lg">
          <img
            src="/images/image.jpg"
            alt="Jewelry crafting"
            className="w-full h-64 object-cover hover:scale-105 transform transition-transform duration-300"
          />
        </div>
      </div>

      {/* Video embed */}
      <div className="mb-8">
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
          <iframe
            src="https://www.youtube.com/embed/dummyvideoid"
            title="Our Artisans at Work"
            className="w-full h-full"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* About story */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl mb-4 text-[#FFAA00] font-heading">Our Artisanal Journey</h2>
        <p className="mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae orci nec dolor ullamcorper
          convallis. Nulla facilisi. Our artisans pour their heart and soul into every piece,
          blending traditional techniques with modern artistry to create jewelry that tells a
          story — your story.
        </p>
        <p>
          Follow us as we continue to craft beauty inspired by nature, dedicated to excellence and
          authenticity in every piece.
        </p>
      </section>
    </main>
  );
}
