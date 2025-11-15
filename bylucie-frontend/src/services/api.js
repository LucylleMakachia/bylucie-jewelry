export function fetchProducts() {
  return Promise.resolve([
    {
      id: 1,
      name: 'Elegant Necklace',
      price: 49.99,
      images: ['/images/necklace1.jpg'],
    },
    {
      id: 2,
      name: 'Classic Ring',
      price: 79.99,
      images: ['/images/ring1.jpg'],
    },
    // Add more sample products as needed
  ]);
}
