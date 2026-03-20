'use client';

import { Award, Target, DollarSign } from 'lucide-react';
import { ComparisonCard } from '../ComparisonCard';
import { TrendChart } from '../TrendChart';
import { CelebrationAnimation } from '../CelebrationAnimation';

interface FinancialProgressSectionProps {
  comparison: any;
  progress: any;
  selectedPeriod: number;
  microExpensesOnly: boolean;
  onPeriodChange: (period: number) => void;
  onMicroExpensesToggle: (checked: boolean) => void;
}

export function FinancialProgressSection({
  comparison,
  progress,
  selectedPeriod,
  microExpensesOnly,
  onPeriodChange,
  onMicroExpensesToggle
}: FinancialProgressSectionProps) {
  if (!comparison && !progress) {
    return null;
  }

  return (
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
              onChange={(e) => onMicroExpensesToggle(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Solo Gastos Hormiga</span>
          </label>

          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(parseInt(e.target.value))}
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
  );
}
