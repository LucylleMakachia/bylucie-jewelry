import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="p-6 min-h-screen flex flex-col items-center justify-center bg-creamBg text-earthyBrownDark">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
      <p className="mb-6 text-center max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="btn-primary px-6 py-3 rounded hover:bg-sunGold transition"
      >
        Go Back Home
      </Link>
    </main>
  );
}
