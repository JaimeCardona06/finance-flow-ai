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
        <div className="space-x-4">
          <Link
            href="/register"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-md font-medium border border-indigo-600 hover:bg-indigo-50"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
