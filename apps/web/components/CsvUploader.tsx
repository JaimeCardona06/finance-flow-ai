'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';

interface CsvUploaderProps {
  onUploadSuccess: () => void;
  token: string;
}

interface ParsedTransaction {
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export function CsvUploader({ onUploadSuccess, token }: CsvUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess(false);
    setIsUploading(true);
    setPendingFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          // Normalizar nombres de columnas (quitar tildes, espacios, mayúsculas)
          const normalizeKey = (key: string) => {
            return key
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
              .trim();
          };

          // Mapear datos del CSV a formato de transacciones
          const transactions: ParsedTransaction[] = results.data
            .map((row: any) => {
              // Crear objeto con keys normalizadas
              const normalizedRow: any = {};
              Object.keys(row).forEach(key => {
                normalizedRow[normalizeKey(key)] = row[key];
              });

              const description = normalizedRow.description || normalizedRow.descripcion || '';
              const amount = parseFloat(normalizedRow.amount || normalizedRow.monto || '0');
              const date = normalizedRow.date || normalizedRow.fecha || new Date().toISOString().split('T')[0];
              const category = normalizedRow.category || normalizedRow.categoria || 'misceláneos';

              return {
                description: description.trim(),
                amount,
                date,
                category
              };
            })
            .filter(t => {
              const isValid = t.description && t.amount > 0;
              return isValid;
            });

          if (transactions.length === 0) {
            setError('No se encontraron transacciones válidas en el archivo');
            setIsUploading(false);
            return;
          }

          // Mostrar preview
          setPreview(transactions.slice(0, 5));
          setShowPreview(true);
          setIsUploading(false);

        } catch (err: any) {
          console.error('Error al parsear CSV:', err);
          setError('Error al procesar el archivo CSV');
          setIsUploading(false);
        }
      },
      error: (err: any) => {
        console.error('Error al leer CSV:', err);
        setError('Error al leer el archivo CSV');
        setIsUploading(false);
      }
    });
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) {
      setError('No se encontró el archivo');
      return;
    }

    setIsUploading(true);
    setError('');

    Papa.parse(pendingFile, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        try {
          // Normalizar nombres de columnas
          const normalizeKey = (key: string) => {
            return key
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim();
          };

          const transactions: ParsedTransaction[] = results.data
            .map((row: any) => {
              const normalizedRow: any = {};
              Object.keys(row).forEach(key => {
                normalizedRow[normalizeKey(key)] = row[key];
              });

              return {
                description: (normalizedRow.description || normalizedRow.descripcion || '').trim(),
                amount: parseFloat(normalizedRow.amount || normalizedRow.monto || '0'),
                date: normalizedRow.date || normalizedRow.fecha || new Date().toISOString().split('T')[0],
                category: normalizedRow.category || normalizedRow.categoria || 'misceláneos'
              };
            })
            .filter(t => t.description && t.amount > 0);

          // Enviar al backend
          const response = await fetch('http://localhost:4000/api/transactions/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ transactions })
          });

          const data = await response.json();

          if (!response.ok) {
            if (data.error?.code === 'PRIVACY_POLICY_NOT_ACCEPTED') {
              setError('Debes aceptar la política de privacidad antes de importar transacciones');
            } else {
              setError(data.error?.message || 'Error al importar transacciones');
            }
            setIsUploading(false);
            return;
          }

          setSuccess(true);
          setShowPreview(false);
          setIsUploading(false);
          setPendingFile(null);
          
          // Notificar éxito
          setTimeout(() => {
            onUploadSuccess();
            setSuccess(false);
          }, 2000);

        } catch (err: any) {
          console.error('Error:', err);
          setError('Error de conexión con el servidor');
          setIsUploading(false);
        }
      },
      error: (err: any) => {
        console.error('Error al parsear:', err);
        setError('Error al procesar el archivo');
        setIsUploading(false);
      }
    });
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreview([]);
    setPendingFile(null);
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-indigo-600" />
        Importar Transacciones (CSV)
      </h3>

      {!showPreview ? (
        <div>
          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Click para subir</span> o arrastra un archivo CSV
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Formato: description, amount, date, category
              </p>
            </div>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>

          {isUploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="text-sm">Procesando archivo...</span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Vista previa (primeras 5 transacciones):
            </p>
            <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              <ul className="space-y-2 text-sm">
                {preview.map((t, i) => (
                  <li key={i} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                    <span className="text-gray-700">{t.description}</span>
                    <span className="font-medium text-gray-900">${t.amount.toLocaleString('es-CO')}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total a importar: {preview.length > 0 ? 'múltiples' : '0'} transacciones
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Importación
                </>
              )}
            </button>
            <button
              onClick={handleCancelPreview}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">¡Transacciones importadas exitosamente!</p>
        </div>
      )}
    </div>
  );
}
