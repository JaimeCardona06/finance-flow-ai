'use client';

import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface ComparisonCardProps {
  currentMonth: {
    month: string;
    totalAmount: number;
    transactionCount: number;
  };
  previousMonth: {
    month: string;
    totalAmount: number;
    transactionCount: number;
  };
  delta: {
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  improvement: boolean;
}

export function ComparisonCard({ currentMonth, previousMonth, delta, improvement }: ComparisonCardProps) {
  // Formatear nombres de meses
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Colores semánticos
  const trendColor = improvement 
    ? 'from-green-500 to-emerald-600' 
    : delta.trend === 'stable'
    ? 'from-gray-500 to-gray-600'
    : 'from-red-500 to-rose-600';

  const bgColor = improvement
    ? 'bg-green-50 border-green-200'
    : delta.trend === 'stable'
    ? 'bg-gray-50 border-gray-200'
    : 'bg-red-50 border-red-200';

  const textColor = improvement
    ? 'text-green-700'
    : delta.trend === 'stable'
    ? 'text-gray-700'
    : 'text-red-700';

  const Icon = delta.trend === 'down' 
    ? TrendingDown 
    : delta.trend === 'up'
    ? TrendingUp
    : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl shadow-lg p-6 border-2 ${bgColor}`}
    >
      {/* Header con gradiente */}
      <div className={`bg-gradient-to-r ${trendColor} text-white rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Comparación Mensual</p>
            <p className="text-2xl font-bold mt-1">
              {improvement ? '¡Mejoraste!' : delta.trend === 'stable' ? 'Estable' : 'Aumentó'}
            </p>
          </div>
          <Icon className="w-10 h-10" />
        </div>
      </div>

      {/* Detalles de comparación */}
      <div className="space-y-4">
        {/* Mes actual */}
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            {formatMonth(currentMonth.month)}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            ${currentMonth.totalAmount.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500">
            {currentMonth.transactionCount} transacciones
          </p>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-300"></div>

        {/* Mes anterior */}
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            {formatMonth(previousMonth.month)}
          </p>
          <p className="text-xl font-semibold text-gray-700">
            ${previousMonth.totalAmount.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500">
            {previousMonth.transactionCount} transacciones
          </p>
        </div>

        {/* Delta */}
        <div className={`rounded-lg p-3 ${bgColor}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${textColor}`}>
              Diferencia:
            </span>
            <div className="text-right">
              <p className={`text-lg font-bold ${textColor}`}>
                {delta.amount > 0 ? '+' : ''}${Math.abs(delta.amount).toLocaleString('es-CO')}
              </p>
              <p className={`text-xs ${textColor}`}>
                {delta.percentage > 0 ? '+' : ''}{delta.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje motivacional */}
        {improvement && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              🎉 Redujiste tus gastos en <strong>${Math.abs(delta.amount).toLocaleString('es-CO')}</strong>. 
              ¡Sigue así!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
