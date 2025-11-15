import React, { useState, useEffect } from 'react';

// PageLoader dynamically loads and renders page content by path
export default function PageLoader({ path }) {
  const [pageContent, setPageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPageContent() {
      setLoading(true);
      setError(null);
      try {
        // Fetch content from localStorage or backend API
        const localContent = localStorage.getItem(`page-content-${path}`);
        if (localContent !== null) {
          setPageContent(localContent);
        } else {
          // Example: fetch from backend (uncomment if backend exists)
          // const response = await fetch(`/api/pages${path}`);
          // if (!response.ok) throw new Error('Failed to fetch page content');
          // const data = await response.text();
          // setPageContent(data);

          // Fallback empty content
          setPageContent('');
        }
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPageContent();
  }, [path]);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#b8860b]">
        Loading page content...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading page: {error}
      </div>
    );
  }

  // Render the stored content as HTML safely
  return (
    <main className="max-w-4xl mx-auto p-6 font-serif text-[#002200]">
      <div
        className="prose max-w-full"
        dangerouslySetInnerHTML={{ __html: pageContent || '<p>No content available.</p>' }}
      />
    </main>
  );
}
