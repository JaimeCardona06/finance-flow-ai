'use client';

import { Sparkles, RefreshCw } from 'lucide-react';
import { InsightCard } from '../InsightCard';

interface AIInsightSectionProps {
  narrative: string;
  isLoading: boolean;
  error: string;
  hasTransactions: boolean;
  onGenerate: () => void;
}

export function AIInsightSection({
  narrative,
  isLoading,
  error,
  hasTransactions,
  onGenerate
}: AIInsightSectionProps) {
  return (
    <div className="space-y-6">
      <button
        onClick={onGenerate}
        disabled={isLoading || !hasTransactions}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Generando insight...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generar Insight con IA
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Insight Card */}
      {narrative && (
        <InsightCard narrative={narrative} />
      )}
    </div>
  );
}
