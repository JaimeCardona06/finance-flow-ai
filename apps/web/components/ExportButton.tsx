'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExport } from '../hooks/useExport';

interface ExportButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function ExportButton({ variant = 'primary', className = '' }: ExportButtonProps) {
  const { exportToExcel, isExporting, error } = useExport();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    const result = await exportToExcel();
    
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const baseClasses = variant === 'primary'
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300';

  return (
    <div className="relative">
      <motion.button
        onClick={handleExport}
        disabled={isExporting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${baseClasses} ${className}
        `}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <svg 
              className="h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <span>Exportar Excel</span>
          </>
        )}
      </motion.button>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-full mt-2 left-0 right-0 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm"
        >
          ✓ Archivo descargado exitosamente
        </motion.div>
      )}

      {/* Mensaje de error */}
      {error && !isExporting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 left-0 right-0 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg text-sm"
        >
          ✗ {error}
        </motion.div>
      )}
    </div>
  );
}
