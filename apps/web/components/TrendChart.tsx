'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface TrendChartProps {
  data: Array<{
    month: string;
    totalAmount: number;
    monthNumber: number;
    year: number;
  }>;
  microExpensesOnly?: boolean;
}

export function TrendChart({ data, microExpensesOnly = false }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay suficientes datos históricos para mostrar la tendencia
      </div>
    );
  }

  // Formatear datos para el gráfico
  const chartData = data.map(item => ({
    month: new Date(item.year, item.monthNumber - 1).toLocaleDateString('es-CO', { 
      month: 'short', 
      year: '2-digit' 
    }),
    amount: item.totalAmount
  }));

  // Calcular tendencia general
  const firstMonth = data[0]?.totalAmount || 0;
  const lastMonth = data[data.length - 1]?.totalAmount || 0;
  const trend = lastMonth < firstMonth ? 'down' : 'up';
  const trendPercentage = firstMonth > 0 
    ? Math.abs(((lastMonth - firstMonth) / firstMonth) * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tendencia de Gastos ({data.length} {data.length === 1 ? 'mes' : 'meses'})
          </h3>
          {microExpensesOnly && (
            <p className="text-xs text-gray-500 mt-1">
              Mostrando solo gastos hormiga (micro-gastos)
            </p>
          )}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          trend === 'down' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {trend === 'down' ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{trendPercentage}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={trend === 'down' ? '#10b981' : '#ef4444'} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={trend === 'down' ? '#10b981' : '#ef4444'} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={(value: any) => `${Number(value || 0).toLocaleString('es-CO')} COP`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke={trend === 'down' ? '#10b981' : '#ef4444'}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
