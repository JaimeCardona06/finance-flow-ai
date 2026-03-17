'use client';

import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface SubscriptionCardProps {
  serviceName: string;
  amount: number;
  frequency: number;
  monthlyEstimate: number;
  annualEstimate: number;
  lastCharge: string;
  index: number;
}

export function SubscriptionCard({
  serviceName,
  amount,
  frequency,
  monthlyEstimate,
  annualEstimate,
  lastCharge,
  index
}: SubscriptionCardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  const hoverVariant = {
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: { duration: 0.2 }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverVariant}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <CreditCard className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{serviceName}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              Último cargo: {formatDate(lastCharge)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Monto por Cargo</p>
          <p className="text-xl font-bold text-gray-900">
            ${amount.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Cada ~{frequency} días
          </p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-3">
          <p className="text-xs text-indigo-600 mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Costo Mensual
          </p>
          <p className="text-xl font-bold text-indigo-900">
            ${monthlyEstimate.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            ~{Math.round(30 / frequency)} cargos/mes
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-700 font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Proyección Anual
            </p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              ${annualEstimate.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-600">COP</p>
            <p className="text-xs text-purple-600 mt-1">
              {Math.round(365 / frequency)} cargos/año
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Si cancelas, ahorrarías ${annualEstimate.toLocaleString('es-CO')} COP al año
        </p>
      </div>
    </motion.div>
  );
}
