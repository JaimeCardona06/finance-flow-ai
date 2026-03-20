'use client';

import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface FinancialSummaryCardsProps {
  totalAmount: number;
  transactionCount: number;
  avgAmount: number;
}

export function FinancialSummaryCards({
  totalAmount,
  transactionCount,
  avgAmount
}: FinancialSummaryCardsProps) {
  return (
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
              {transactionCount}
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
  );
}
