import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FinanceFlow AI
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Descubre dónde se va tu dinero sin darte cuenta
        </p>
        <Link
          href="/register"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700"
        >
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
