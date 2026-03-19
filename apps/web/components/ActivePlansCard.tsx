'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, RefreshCw, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreatePlanModal } from './CreatePlanModal';

interface SavingsPlan {
  _id: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'failed';
  progressPercentage: number;
  daysRemaining: number;
  statusColor: 'green' | 'yellow' | 'red';
}

interface ActivePlansCardProps {
  token: string;
  reloadTrigger?: number; // Trigger para recargar automáticamente
  onPlanCreated?: () => void;
}

export function ActivePlansCard({ token, reloadTrigger, onPlanCreated }: ActivePlansCardProps) {
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/plans/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error al cargar planes:', data.error);
        setPlans([]);
        return;
      }

      setPlans(data.data.plans || []);
    } catch (err) {
      console.error('Error:', err);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPlans();
    }
  }, [token]);

  // Recargar automáticamente cuando cambia el trigger (cuando se agregan transacciones)
  useEffect(() => {
    if (token && reloadTrigger !== undefined) {
      loadPlans();
    }
  }, [reloadTrigger]);

  const handlePlanCreated = () => {
    loadPlans();
    if (onPlanCreated) {
      onPlanCreated();
    }
  };

  const handleDeletePlan = async (planId: string, category: string) => {
    // Confirmación
    if (!confirm(`¿Estás seguro de eliminar la meta de "${category}"?`)) {
      return;
    }

    setDeletingPlanId(planId);

    try {
      const response = await fetch(`http://localhost:4000/api/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error?.message || 'Error al eliminar la meta');
        return;
      }

      // Recargar planes y notificar al padre
      loadPlans();
      if (onPlanCreated) {
        onPlanCreated();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión al eliminar la meta');
    } finally {
      setDeletingPlanId(null);
    }
  };

  const getProgressBarColor = (statusColor: string) => {
    switch (statusColor) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressBarBgColor = (statusColor: string) => {
    switch (statusColor) {
      case 'green':
        return 'bg-green-100';
      case 'yellow':
        return 'bg-yellow-100';
      case 'red':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Metas de Ahorro
              </h3>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Crear nueva meta"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {plans.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {plans.length} {plans.length === 1 ? 'meta activa' : 'metas activas'}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="ml-3 text-sm text-gray-600">Cargando metas...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                No tienes metas activas
              </p>
              <p className="text-xs text-gray-500">
                Crea una meta para controlar tus gastos por categoría
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {/* Category and Status */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 capitalize">
                      {plan.category}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        plan.statusColor === 'green' 
                          ? 'bg-green-100 text-green-700'
                          : plan.statusColor === 'yellow'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {plan.progressPercentage}%
                      </span>
                      <button
                        onClick={() => handleDeletePlan(plan._id, plan.category)}
                        disabled={deletingPlanId === plan._id}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Eliminar meta"
                      >
                        {deletingPlanId === plan._id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span>
                      Gastado: ${plan.currentAmount.toLocaleString('es-CO')} de ${plan.targetAmount.toLocaleString('es-CO')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${getProgressBarBgColor(plan.statusColor)}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(plan.progressPercentage, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full ${getProgressBarColor(plan.statusColor)}`}
                    />
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {plan.daysRemaining > 0 
                          ? `${plan.daysRemaining} ${plan.daysRemaining === 1 ? 'día' : 'días'} restantes`
                          : 'Finalizado'
                        }
                      </span>
                    </div>
                    {plan.statusColor === 'yellow' && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>¡Cuidado!</span>
                      </div>
                    )}
                    {plan.statusColor === 'red' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>Límite superado</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CreatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePlanCreated}
        token={token}
      />
    </>
  );
}
