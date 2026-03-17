'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InsightCard } from '../../components/InsightCard';
import { CsvUploader } from '../../components/CsvUploader';
import { QuickAddInput } from '../../components/QuickAddInput';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { WeekdayChart } from '../../components/WeekdayChart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, PieChart as PieChartIcon, LogOut, Sparkles, RefreshCw, CreditCard } from 'lucide-react';

// Mapa de colores por categoría (sincronizado en todo el dashboard)
const CATEGORY_COLORS: Record<string, string> = {
  'café/bebidas': '#8B4513',      // Marrón café
  'comida rápida': '#FF6B6B',     // Rojo coral
  'comida': '#FFA500',            // Naranja
  'transporte': '#4ECDC4',        // Turquesa
  'suscripciones': '#9B59B6',     // Púrpura
  'entretenimiento': '#F38181',   // Rosa salmón
  'hogar': '#3498DB',             // Azul
  'salud': '#2ECC71',             // Verde
  'educación': '#E74C3C',         // Rojo
  'servicios': '#F39C12',         // Amarillo dorado
  'misceláneos': '#95A5A6'        // Gris neutro
};

// Función helper para obtener color con fallback
const getCategoryColor = (category?: string): string => {
  if (!category) return '#95A5A6'; // Gris neutro por defecto
  return CATEGORY_COLORS[category.toLowerCase()] || '#95A5A6';
};

interface Transaction {
  _id?: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

interface Subscription {
  serviceName: string;
  amount: number;
  frequency: number;
  monthlyEstimate: number;
  annualEstimate: number;
  lastCharge: string;
  transactions: string[];
}

export default function AnalysisPage() {
  const router = useRouter();
  const [narrative, setNarrative] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);

  // Verificar autenticación y cargar transacciones
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

    // Cargar transacciones desde la BD
    loadTransactions(storedToken);
    
    // Cargar suscripciones
    loadSubscriptions(storedToken);
  }, [router]);

  const loadTransactions = async (authToken: string) => {
    setIsLoadingTransactions(true);
    try {
      const response = await fetch('http://localhost:4000/api/transactions', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        console.error('Error al cargar transacciones:', data.error);
        setTransactions([]);
        return;
      }

      setTransactions(data.data.transactions || []);
    } catch (err) {
      console.error('Error:', err);
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadSubscriptions = async (authToken: string) => {
    setIsLoadingSubscriptions(true);
    try {
      const response = await fetch('http://localhost:4000/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        console.error('Error al cargar suscripciones:', data.error);
        setSubscriptions([]);
        return;
      }

      setSubscriptions(data.data.subscriptions || []);
    } catch (err) {
      console.error('Error:', err);
      setSubscriptions([]);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (transactions.length === 0) {
      setError('No hay transacciones para analizar. Importa o agrega transacciones primero.');
      return;
    }

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
          transactions: transactions.map(t => ({
            description: t.description,
            amount: t.amount,
            date: t.date,
            category: t.category
          }))
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const categoryData = Object.entries(
    transactions.reduce((acc, t) => {
      const cat = t.category || 'misceláneos';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: getCategoryColor(name)
  })).sort((a, b) => b.value - a.value);

  // Análisis temporal: agrupar por fecha y sumar correctamente
  const timelineData = transactions
    .reduce((acc, t) => {
      const date = t.date;
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.amount += t.amount;
      } else {
        acc.push({ date, amount: t.amount });
      }
      return acc;
    }, [] as { date: string; amount: number }[])
    .sort((a, b) => a.date.localeCompare(b.date)) // Ordenar cronológicamente
    .map(item => ({
      ...item,
      dateFormatted: new Date(item.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
    }));

  // Análisis por día de semana
  const weekdayData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[dayOfWeek];
    
    if (!acc[dayName]) {
      acc[dayName] = { day: dayName, amount: 0, count: 0 };
    }
    acc[dayName].amount += t.amount;
    acc[dayName].count += 1;
    
    return acc;
  }, {} as Record<string, { day: string; amount: number; count: number }>);

  const weekdayChartData = Object.values(weekdayData)
    .sort((a, b) => {
      const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      return order.indexOf(a.day) - order.indexOf(b.day);
    })
    .map(item => ({
      day: item.day,
      amount: item.amount,
      average: Math.round(item.amount / item.count)
    }));

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = transactions.length > 0 ? Math.round(totalAmount / transactions.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Dashboard Financiero
              </h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Bienvenido, {user.name}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalAmount.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">COP</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transacciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">en el período</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${avgAmount.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">COP</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* CSV Uploader */}
        <div className="mb-8">
          <CsvUploader 
            token={token} 
            onUploadSuccess={() => {
              loadTransactions(token);
              loadSubscriptions(token); // Recargar suscripciones también
            }} 
          />
        </div>

        {/* Quick Add con IA */}
        <div className="mb-8">
          <QuickAddInput 
            token={token} 
            onSuccess={() => {
              loadTransactions(token);
              loadSubscriptions(token); // Recargar suscripciones también
            }} 
          />
        </div>

        {/* Panel de transacciones */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tus Transacciones</h2>
            {isLoadingTransactions && (
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Actualizando...</span>
              </div>
            )}
          </div>

          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Cargando transacciones...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No tienes transacciones aún.</p>
              <p className="text-sm text-gray-500 mt-2">Importa un CSV o agrega gastos manualmente.</p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto border border-gray-200">
              <ul className="space-y-2 text-sm">
                {transactions.map((t, i) => (
                  <li key={t._id || i} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: getCategoryColor(t.category) }}
                        title={t.category || 'Sin categoría'}
                      />
                      <div className="flex flex-col">
                        <span className="text-gray-700">{t.description}</span>
                        <span className="text-xs text-gray-500">{t.category || 'misceláneos'}</span>
                      </div>
                    </div>
                    <span className="font-medium text-gray-900">${t.amount.toLocaleString('es-CO')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Botón de generación */}
        <div className="mb-8">
          <button
            onClick={handleGenerateNarrative}
            disabled={isLoading || transactions.length === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {isLoading ? 'Analizando con IA...' : 'Generar Insight con IA'}
          </button>
        </div>

        {/* Sección de Suscripciones */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                  Suscripciones y Gastos Recurrentes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isLoadingSubscriptions ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Detectando suscripciones...
                    </span>
                  ) : (
                    `Detectamos ${subscriptions.length} ${subscriptions.length === 1 ? 'suscripción' : 'suscripciones'} activas`
                  )}
                </p>
              </div>
              {!isLoadingSubscriptions && (
                <button
                  onClick={() => loadSubscriptions(token)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                  title="Recargar suscripciones"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Resumen de suscripciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Total Mensual en Suscripciones</p>
                <p className="text-3xl font-bold">
                  ${subscriptions.reduce((sum, sub) => sum + sub.monthlyEstimate, 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs opacity-75 mt-2">COP por mes</p>
              </div>

              <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Proyección Anual</p>
                <p className="text-3xl font-bold">
                  ${subscriptions.reduce((sum, sub) => sum + sub.annualEstimate, 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs opacity-75 mt-2">COP por año</p>
              </div>
            </div>

            {/* Grid de tarjetas de suscripciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((subscription, index) => (
                <SubscriptionCard
                  key={`${subscription.serviceName}-${index}`}
                  serviceName={subscription.serviceName}
                  amount={subscription.amount}
                  frequency={subscription.frequency}
                  monthlyEstimate={subscription.monthlyEstimate}
                  annualEstimate={subscription.annualEstimate}
                  lastCharge={subscription.lastCharge}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Layout de 2 columnas: Insight + Gráficos */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna izquierda: Insight de IA */}
            <div className="lg:col-span-1">
              <InsightCard 
                narrative={narrative}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* Columna derecha: Gráficos */}
            <div className="lg:col-span-1 space-y-6">
              {/* Gráfico de barras por categoría */}
              {categoryData.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-indigo-600" />
                    Gastos por Categoría
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => `$${Number(value || 0).toLocaleString('es-CO')} COP`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico de línea temporal */}
              {timelineData.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Evolución Temporal
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="dateFormatted" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => `$${Number(value || 0).toLocaleString('es-CO')} COP`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico de pie (distribución) */}
              {categoryData.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-indigo-600" />
                    Distribución de Gastos
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => `$${Number(value || 0).toLocaleString('es-CO')} COP`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico de gastos por día de semana */}
              <WeekdayChart data={weekdayChartData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
