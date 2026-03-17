'use client';

import { useState } from 'react';
import { Sparkles, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface QuickAddInputProps {
  onSuccess: () => void;
  token: string;
}

export function QuickAddInput({ onSuccess, token }: QuickAddInputProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:4000/api/transactions/quick-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: text.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'PRIVACY_POLICY_NOT_ACCEPTED') {
          setError('Debes aceptar la política de privacidad antes de agregar transacciones');
        } else if (data.error?.code === 'NO_TRANSACTIONS_FOUND') {
          setError('No entendí los gastos. Intenta con un formato como: "15k en almuerzo, 50 lucas de gasolina"');
        } else {
          setError(data.error?.message || 'Error al procesar los gastos');
        }
        setIsLoading(false);
        return;
      }

      // Éxito
      setSuccess(data.data.message || `${data.data.count} transacciones agregadas`);
      setText('');
      
      // Recargar transacciones después de 1 segundo
      setTimeout(() => {
        onSuccess();
        setSuccess('');
      }, 1500);

    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Agregar Gastos con IA
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué gastaste hoy? Ej: 15k en almuerzo, 50 lucas de gasolina y ayer 200 en arriendo"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="absolute bottom-3 right-3 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title={isLoading ? 'Analizando con IA...' : 'Enviar'}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-xs whitespace-nowrap">Analizando...</span>
              </>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Puedes usar "k" o "lucas" para miles (ej: 50k = $50,000). Menciona varios gastos separados por comas.
        </p>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}
    </div>
  );
}
