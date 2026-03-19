import { Request, Response } from 'express';
import { generateNarrative } from '../services/aiService';
import { getMonthlyComparison } from '../services/statsService';

/**
 * POST /api/analysis/narrative
 * Generar narrativa financiera usando IA
 * Requiere autenticación
 */
export async function createNarrative(req: Request, res: Response): Promise<void> {
  try {
    const { transactions } = req.body;
    const userId = req.userId;

    // Validar que se enviaron transacciones
    if (!transactions || !Array.isArray(transactions)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Se requiere un array de transacciones'
        }
      });
      return;
    }

    if (transactions.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_TRANSACTIONS',
          message: 'No hay transacciones para analizar'
        }
      });
      return;
    }

    // Validar estructura básica de transacciones
    const isValid = transactions.every(t => 
      t.description && 
      typeof t.amount === 'number' && 
      t.date
    );

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSACTION_FORMAT',
          message: 'Formato de transacciones inválido. Se requiere: description, amount, date'
        }
      });
      return;
    }

    // Obtener comparación mensual si el usuario está autenticado
    let comparisonData = undefined;
    if (userId) {
      try {
        const comparison = await getMonthlyComparison(userId);
        if (comparison) {
          comparisonData = comparison;
        }
      } catch (err) {
        // Si falla la comparación, continuar sin ella
        console.error('Error al obtener comparación para narrativa:', err);
      }
    }

    // Generar narrativa con IA (con contexto histórico y planes activos si están disponibles)
    const startTime = Date.now();
    const narrative = await generateNarrative(transactions, userId, comparisonData);
    const processingTime = Date.now() - startTime;

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: {
        narrative,
        metadata: {
          transactionCount: transactions.length,
          processingTimeMs: processingTime,
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
          hasHistoricalContext: !!comparisonData
        }
      }
    });

  } catch (error) {
    console.error('Error al generar narrativa:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'NARRATIVE_GENERATION_ERROR',
        message: 'Error al generar narrativa financiera'
      }
    });
  }
}
