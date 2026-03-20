import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Transaction, Subscription, CategoryData, TimelineData, WeekdayData } from '../types/dashboard';

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

export function useDashboardData() {
  const router = useRouter();
  
  // Estados
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
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6);
  const [microExpensesOnly, setMicroExpensesOnly] = useState<boolean>(false);

  // Funciones de carga
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
    }
  };

  const loadProgress = async (authToken: string) => {
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
    }
  };

  const reloadAllData = () => {
    if (token) {
      loadTransactions(token);
      loadSubscriptions(token);
      loadComparison(token);
      loadProgress(token);
    }
  };

  // Handlers
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

  // Efectos
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
  }, [selectedPeriod, microExpensesOnly, token]);

  // Preparar datos para gráficos
  const categoryData: CategoryData[] = Object.entries(
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

  const timelineData: TimelineData[] = transactions
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

  const weekdayChartData: WeekdayData[] = Object.values(weekdayData)
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

  return {
    // Estados
    token,
    user,
    transactions,
    subscriptions,
    comparison,
    progress,
    narrative,
    error,
    isLoading,
    isLoadingTransactions,
    isLoadingSubscriptions,
    selectedPeriod,
    microExpensesOnly,
    
    // Datos procesados
    categoryData,
    timelineData,
    weekdayChartData,
    totalAmount,
    avgAmount,
    
    // Funciones
    setSelectedPeriod,
    setMicroExpensesOnly,
    handleGenerateNarrative,
    handleLogout,
    reloadAllData,
    loadSubscriptions,
    getCategoryColor
  };
}
