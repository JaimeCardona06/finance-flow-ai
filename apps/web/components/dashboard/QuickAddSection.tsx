'use client';

import { Sparkles } from 'lucide-react';
import { QuickAddInput } from '../QuickAddInput';

interface QuickAddSectionProps {
  token: string;
  onSuccess: () => void;
}

export function QuickAddSection({ token, onSuccess }: QuickAddSectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-indigo-600" />
        Agregar Gastos con IA
      </h2>
      <QuickAddInput token={token} onSuccess={onSuccess} />
    </div>
  );
}
