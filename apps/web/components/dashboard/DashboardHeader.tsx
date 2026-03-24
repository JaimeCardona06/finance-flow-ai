'use client';

import { LogOut, Sparkles } from 'lucide-react';
import { ExportButton } from '../ExportButton';

interface DashboardHeaderProps {
  userName?: string;
  onLogout: () => void;
}

export function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Centro de Control Financiero
            </h1>
            {userName && (
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, {userName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ExportButton variant="secondary" />
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
