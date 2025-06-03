import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F0F0F] text-white p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors">
        Return Home
      </Link>
    </div>
  );
}
