'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InsightCard } from '../../components/InsightCard';
import { CsvUploader } from '../../components/CsvUploader';
import { QuickAddInput } from '../../components/QuickAddInput';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { WeekdayChart } from '../../components/WeekdayChart';
import { ComparisonCard } from '../../components/ComparisonCard';
import { TrendChart } from '../../components/TrendChart';
import { CelebrationAnimation } from '../../components/CelebrationAnimation';
import { ActivePlansCard } from '../../components/ActivePlansCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, PieChart as PieChartIcon, LogOut, Sparkles, RefreshCw, CreditCard, Award, Target } from 'lucide-react';

// Mapa de colores por categoría
const CATEGORY_COLORS: Record<string, string> = {
  'café/bebidas': '#8B4513',
  'comida rápida': '#FF6B6B',
  'comida': '#FFA500',
  'transporte': '#4ECDC4',
  'suscripciones': '#9B59B6',
  'entretenimiento': '#F38181',
  'hogar': '#3498DB',
  'salud': '#2ECC71',
  'educación': '#E74C3C',
  'servicios': '#F39C12',
  'misceláneos': '#95A5A6'
};

const getCategoryColor = (category?: string): string => {
  if (!category) return '#95A5A6';
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
  const [comparison, setComparison] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6);
  const [microExpensesOnly, setMicroExpensesOnly] = useState<boolean>(false);

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

    loadTransactions(storedToken);
    loadSubscriptions(storedToken);
    loadComparison(storedToken);
    loadProgress(storedToken);
  }, [router]);

  useEffect(() => {
    if (token) {
      loadProgress(token);
    }
  }, [selectedPeriod, microExpensesOnly]);

  const loadTransactions = async (authToken: string) => {
    setIsLoadingTransactions(true);
    try {
      const response = await fetch('http://localhost:4000/api/transactions', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        setTransactions([]);
        return;
      }
      setTransactions(data.data.transactions || []);
    } catch (err) {
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadSubscriptions = async (authToken: string) => {
    setIsLoadingSubscriptions(true);
    try {
      const response = await fetch('http://localhost:4000/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        setSubscriptions([]);
        return;
      }
      setSubscriptions(data.data.subscriptions || []);
    } catch (err) {
      setSubscriptions([]);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const loadComparison = async (authToken: string) => {
    setIsLoadingComparison(true);
    try {
      const response = await fetch('http://localhost:4000/api/stats/comparison', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        setComparison(null);
        return;
      }
      setComparison(data.data.comparison);
    } catch (err) {
      setComparison(null);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const loadProgress = async (authToken: string) => {
    setIsLoadingProgress(true);
    try {
      const response = await fetch(
        `http://localhost:4000/api/stats/progress?months=${selectedPeriod}&microExpensesOnly=${microExpensesOnly}`,
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        setProgress(null);
        return;
      }
      setProgress(data.data.progress);
    } catch (err) {
      setProgress(null);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (transactions.length === 0) {
      setError('No hay transacciones para analizar.');
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
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(item => ({
      ...item,
      dateFormatted: new Date(item.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
    }));

  const weekdayData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const dayOfWeek = date.getDay();
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
                Centro de Control Financiero
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

        {/* HERO CHART: Progreso Financiero - Ancho Completo */}
        {(comparison || progress) && (
          <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Tu Progreso Financiero
                </h2>
              </div>

              {/* Controles de filtrado */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={microExpensesOnly}
                    onChange={(e) => setMicroExpensesOnly(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Solo Gastos Hormiga</span>
                </label>

                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>Último mes</option>
                  <option value={3}>Últimos 3 meses</option>
                  <option value={6}>Últimos 6 meses</option>
                </select>
              </div>
            </div>

            {comparison && (
              <CelebrationAnimation
                trigger={comparison.improvement && Math.abs(comparison.delta.percentage) >= 15}
                improvement={comparison.improvement}
                deltaPercentage={comparison.delta.percentage}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {comparison && (
                <div className="lg:col-span-1">
                  <ComparisonCard
                    currentMonth={comparison.currentMonth}
                    previousMonth={comparison.previousMonth}
                    delta={comparison.delta}
                    improvement={comparison.improvement}
                  />
                </div>
              )}

              {progress && progress.monthlyHistory.length > 0 && (
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {progress.bestMonth && (
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5" />
                          <p className="text-sm opacity-90">Mejor Mes</p>
                        </div>
                        <p className="text-2xl font-bold">
                          ${progress.bestMonth.totalAmount.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(progress.bestMonth.year, progress.bestMonth.monthNumber - 1).toLocaleDateString('es-CO', { month: 'long' })}
                        </p>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5" />
                        <p className="text-sm opacity-90">Promedio</p>
                      </div>
                      <p className="text-2xl font-bold">
                        ${Math.round(progress.averageMonthlySpending).toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs opacity-75 mt-1">por mes</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5" />
                        <p className="text-sm opacity-90">Racha</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {progress.improvementStreak}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {progress.improvementStreak === 1 ? 'mes mejorando' : 'meses mejorando'}
                      </p>
                    </div>
                  </div>

                  <TrendChart data={progress.monthlyHistory} microExpensesOnly={microExpensesOnly} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* GRID DE 2 COLUMNAS: Panel de Análisis (2/3) + Sidebar de Operaciones (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PANEL DE ANÁLISIS (Izquierda - 2/3) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick Add Input - Movido aquí para mejor UX */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Agregar Gastos con IA
              </h2>
              <QuickAddInput 
                token={token} 
                onSuccess={() => {
                  loadTransactions(token);
                  loadSubscriptions(token);
                  loadComparison(token);
                  loadProgress(token);
                }} 
              />
            </div>

            {/* Sección de Suscripciones */}
            {subscriptions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                      Suscripciones Activas
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {isLoadingSubscriptions ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Detectando...
                        </span>
                      ) : (
                        `${subscriptions.length} ${subscriptions.length === 1 ? 'suscripción' : 'suscripciones'} detectadas`
                      )}
                    </p>
                  </div>
                  {!isLoadingSubscriptions && (
                    <button
                      onClick={() => loadSubscriptions(token)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-sm opacity-90 mb-1">Total Mensual</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Botón Generar Insight con IA - Movido aquí para mejor legibilidad */}
            <div className="space-y-6">
              <button
                onClick={handleGenerateNarrative}
                disabled={isLoading || transactions.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generando insight...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar Insight con IA
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Insight Card */}
              {narrative && (
                <InsightCard narrative={narrative} />
              )}
            </div>

            {/* Gráficos de Distribución */}
            {transactions.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <PieChartIcon className="w-6 h-6 text-indigo-600" />
                  Análisis de Distribución
                </h2>

                {categoryData.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                          formatter={(value: any) => `${Number(value || 0).toLocaleString('es-CO')} COP`}
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

                {timelineData.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                          formatter={(value: any) => `${Number(value || 0).toLocaleString('es-CO')} COP`}
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

                {categoryData.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                          formatter={(value: any) => `${Number(value || 0).toLocaleString('es-CO')} COP`}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <WeekdayChart data={weekdayChartData} />
              </div>
            )}
          </div>

          {/* SIDEBAR DE OPERACIONES (Derecha - 1/3) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Metas de Ahorro (Slice 5) */}
            <ActivePlansCard 
              token={token}
              reloadTrigger={transactions.length} // Trigger para recargar cuando cambian las transacciones
              onPlanCreated={() => {
                loadTransactions(token);
                loadSubscriptions(token);
                loadComparison(token);
                loadProgress(token);
              }}
            />

            {/* CSV Uploader */}
            <CsvUploader 
              token={token} 
              onUploadSuccess={() => {
                loadTransactions(token);
                loadSubscriptions(token);
                loadComparison(token);
                loadProgress(token);
              }} 
            />

            {/* Lista de Transacciones */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transacciones Recientes
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {transactions.length} {transactions.length === 1 ? 'transacción' : 'transacciones'}
                </p>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {isLoadingTransactions ? (
                  <div className="p-6 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cargando transacciones...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-600">No hay transacciones aún</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Agrega una transacción o importa un CSV
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {transactions.slice(0, 50).map((transaction, index) => (
                      <div 
                        key={transaction._id || index} 
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {transaction.description}
                            </p>
                            {transaction.category && (
                              <span 
                                className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full"
                                style={{
                                  backgroundColor: `${getCategoryColor(transaction.category)}20`,
                                  color: getCategoryColor(transaction.category)
                                }}
                              >
                                {transaction.category}
                              </span>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(transaction.date).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900">
                              ${transaction.amount.toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
