'use client';

import { CreditCard, RefreshCw } from 'lucide-react';
import { SubscriptionCard } from '../SubscriptionCard';
import type { Subscription } from '../../types/dashboard';

interface SubscriptionsSectionProps {
  subscriptions: Subscription[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function SubscriptionsSection({
  subscriptions,
  isLoading,
  onRefresh
}: SubscriptionsSectionProps) {
  if (subscriptions.length === 0) {
    return null;
  }

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.monthlyEstimate, 0);
  const totalAnnual = subscriptions.reduce((sum, sub) => sum + sub.annualEstimate, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Suscripciones Activas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Detectando...
              </span>
            ) : (
              `${subscriptions.length} ${subscriptions.length === 1 ? 'suscripción' : 'suscripciones'} detectadas`
            )}
          </p>
        </div>
        {!isLoading && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            aria-label="Recargar suscripciones"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Total Mensual</p>
          <p className="text-3xl font-bold">
            ${totalMonthly.toLocaleString('es-CO')}
          </p>
          <p className="text-xs opacity-75 mt-2">COP por mes</p>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Proyección Anual</p>
          <p className="text-3xl font-bold">
            ${totalAnnual.toLocaleString('es-CO')}
          </p>
          <p className="text-xs opacity-75 mt-2">COP por año</p>
        </div>
      </div>

      {/* Subscription Cards Grid */}
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
  );
}
