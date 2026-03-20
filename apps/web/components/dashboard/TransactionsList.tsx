'use client';

import { RefreshCw } from 'lucide-react';
import type { Transaction } from '../../types/dashboard';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading: boolean;
  getCategoryColor: (category?: string) => string;
}

export function TransactionsList({
  transactions,
  isLoading,
  getCategoryColor
}: TransactionsListProps) {
  return (
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
        {isLoading ? (
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
  );
}
