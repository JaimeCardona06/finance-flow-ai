'use client';

import { useState } from 'react';
import type { ExportOptions, ExportStats } from '@financeflow/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Exporta las transacciones a Excel y descarga el archivo
   */
  const exportToExcel = async (options?: ExportOptions) => {
    setIsExporting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      // Construir query params
      const params = new URLSearchParams();
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);

      const queryString = params.toString();
      const url = `${API_URL}/api/export/excel${queryString ? `?${queryString}` : ''}`;

      // Hacer request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al exportar');
      }

      // Obtener blob del archivo
      const blob = await response.blob();

      // Extraer nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `financeflow-transacciones-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Crear URL temporal y descargar
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL temporal
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, filename };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al exportar:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Obtiene estadísticas de exportación
   */
  const getExportStats = async (): Promise<ExportStats | null> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`${API_URL}/api/export/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }

      const stats: ExportStats = await response.json();
      return stats;
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return null;
    }
  };

  return {
    exportToExcel,
    getExportStats,
    isExporting,
    error
  };
}
