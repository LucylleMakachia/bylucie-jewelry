import React, { useEffect, useState } from 'react';

export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // mock fetching posts
    setPosts([
      { id: 1, imageUrl: '/images/insta1.jpg', link: '#' },
      { id: 2, imageUrl: '/images/insta2.jpg', link: '#' },
      { id: 3, imageUrl: '/images/insta3.jpg', link: '#' },
      { id: 4, imageUrl: '/images/insta4.jpg', link: '#' },
    ]);
  }, []);

  return (
    <section className="my-8 p-6 bg-earthyBrownLight rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Instagram Feed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {posts.map((post) => (
          <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer">
            <img
              src={post.imageUrl}
              alt={`Instagram post ${post.id}`}
              className="w-full h-32 object-cover rounded hover:opacity-80 transition"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
