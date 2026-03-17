'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InsightCard } from '../../components/InsightCard';

// Gastos de ejemplo predefinidos
const SAMPLE_TRANSACTIONS = [
  { description: 'Café Juan Valdez', amount: 8500, date: '2024-01-15', category: 'café/bebidas' },
  { description: 'Almuerzo ejecutivo', amount: 22000, date: '2024-01-15', category: 'comida rápida' },
  { description: 'Uber al trabajo', amount: 12000, date: '2024-01-16', category: 'transporte' },
  { description: 'Café Starbucks', amount: 9500, date: '2024-01-16', category: 'café/bebidas' },
  { description: 'Rappi domicilio', amount: 35000, date: '2024-01-17', category: 'comida rápida' },
  { description: 'Netflix suscripción', amount: 44900, date: '2024-01-18', category: 'suscripciones' },
  { description: 'Café tienda barrio', amount: 3000, date: '2024-01-18', category: 'café/bebidas' },
  { description: 'Uber Eats', amount: 28000, date: '2024-01-19', category: 'comida rápida' },
  { description: 'Spotify Premium', amount: 16900, date: '2024-01-20', category: 'suscripciones' },
  { description: 'Café Juan Valdez', amount: 8500, date: '2024-01-20', category: 'café/bebidas' }
];

// Pool de gastos para generar aleatorios
const RANDOM_EXPENSES = [
  { description: 'Rappi domicilio', amount: [25000, 35000, 45000], category: 'comida rápida' },
  { description: 'Uber Eats', amount: [20000, 30000, 40000], category: 'comida rápida' },
  { description: 'Café Juan Valdez', amount: [7000, 8500, 10000], category: 'café/bebidas' },
  { description: 'Starbucks', amount: [9000, 12000, 15000], category: 'café/bebidas' },
  { description: 'Uber', amount: [8000, 12000, 18000], category: 'transporte' },
  { description: 'DiDi', amount: [7000, 10000, 15000], category: 'transporte' },
  { description: 'Netflix', amount: [44900], category: 'suscripciones' },
  { description: 'Spotify', amount: [16900], category: 'suscripciones' },
  { description: 'HBO Max', amount: [35900], category: 'suscripciones' },
  { description: 'Almuerzo ejecutivo', amount: [18000, 22000, 28000], category: 'comida rápida' },
  { description: 'Tienda Oxxo', amount: [5000, 8000, 12000], category: 'misceláneos' },
  { description: 'Cine', amount: [25000, 30000], category: 'entretenimiento' }
];

export default function AnalysisPage() {
  const router = useRouter();
  const [narrative, setNarrative] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState(SAMPLE_TRANSACTIONS);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Verificar autenticación al cargar la página
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken) {
      router.push('/login');
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const generateRandomTransactions = () => {
    const count = Math.floor(Math.random() * 5) + 8; // 8-12 transacciones
    const randomTxs = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const expense = RANDOM_EXPENSES[Math.floor(Math.random() * RANDOM_EXPENSES.length)];
      const amounts = expense.amount;
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);

      randomTxs.push({
        description: expense.description,
        amount,
        date: date.toISOString().split('T')[0],
        category: expense.category
      });
    }

    setTransactions(randomTxs.sort((a, b) => b.date.localeCompare(a.date)));
    setNarrative(''); // Limpiar narrativa anterior
  };

  const handleGenerateNarrative = async () => {
    setIsLoading(true);
    setError('');
    setNarrative('');

    try {
      const response = await fetch('http://localhost:4000/api/analysis/narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactions
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        setError(data.error?.message || 'Error al generar narrativa');
        return;
      }

      setNarrative(data.data.narrative);
      console.log('Metadata:', data.data.metadata);

    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Análisis con IA
            </h1>
            {user && (
              <p className="text-gray-600 mt-1">
                Bienvenido, {user.name}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Panel de transacciones */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Tus Transacciones</h2>
            <div className="space-x-2">
              <button
                onClick={generateRandomTransactions}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
              >
                🎲 Generar Aleatorios
              </button>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
              >
                {showCustomInput ? '✕ Cerrar' : '✏️ Personalizar'}
              </button>
            </div>
          </div>

          {showCustomInput && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 mb-2">
                Pega tus gastos (formato: descripción, monto, fecha)
              </p>
              <textarea
                className="w-full h-32 p-2 border border-gray-300 rounded text-sm font-mono"
                placeholder="Café Juan Valdez, 8500, 2024-01-15&#10;Rappi domicilio, 35000, 2024-01-16"
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter(l => l.trim());
                  const parsed = lines.map(line => {
                    const [desc, amt, date] = line.split(',').map(s => s.trim());
                    return {
                      description: desc || 'Gasto',
                      amount: parseInt(amt) || 0,
                      date: date || new Date().toISOString().split('T')[0],
                      category: 'misceláneos'
                    };
                  }).filter(t => t.amount > 0);
                  if (parsed.length > 0) {
                    setTransactions(parsed);
                  }
                }}
              />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
            <ul className="space-y-2 text-sm">
              {transactions.map((t, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-gray-700">{t.description}</span>
                  <span className="font-medium">${t.amount.toLocaleString('es-CO')} COP</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Total: ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString('es-CO')} COP
            {' • '}
            {transactions.length} transacciones
          </p>
        </div>

        {/* Botón de generación */}
        <div className="mb-6">
          <button
            onClick={handleGenerateNarrative}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '🤖 Analizando con IA...' : '✨ Generar Insight con IA'}
          </button>
        </div>

        {/* Resultado */}
        <InsightCard 
          narrative={narrative}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
