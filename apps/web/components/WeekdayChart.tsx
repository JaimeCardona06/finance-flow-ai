'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

interface WeekdayChartProps {
  data: Array<{
    day: string;
    amount: number;
    average: number;
  }>;
}

export function WeekdayChart({ data }: WeekdayChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-indigo-600" />
        Gastos por Día de Semana
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: any) => `${Number(value || 0).toLocaleString('es-CO')} COP`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-3">
        💡 Identifica los días donde más gastas para ajustar tus hábitos
      </p>
    </div>
  );
}
