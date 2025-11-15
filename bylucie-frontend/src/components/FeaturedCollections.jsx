import React from 'react';
import { Link } from 'react-router-dom';

const collections = [
  {
    id: 1,
    name: 'Elegant Necklaces',
    description: 'Timeless designs crafted with care.',
    image: '/images/collections/necklaces.jpg',
    link: '/products?category=necklaces',
  },
  {
    id: 2,
    name: 'Classic Rings',
    description: 'Perfect for every occasion.',
    image: '/images/collections/rings.jpg',
    link: '/products?category=rings',
  },
  {
    id: 3,
    name: 'Beautiful Bracelets',
    description: 'Add sparkle to your wrist.',
    image: '/images/collections/bracelets.jpg',
    link: '/products?category=bracelets',
  },
];

export default function FeaturedCollections() {
  return (
    <section className="p-6 bg-sunGold text-earthyBrownDark rounded shadow my-8">
      <h2 className="text-3xl font-bold mb-6">Featured Collections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Link
            to={collection.link}
            key={collection.id}
            className="group block rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition"
          >
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="p-4 bg-white dark:bg-earthyBrownLight">
              <h3 className="font-semibold text-xl mb-2">{collection.name}</h3>
              <p>{collection.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
