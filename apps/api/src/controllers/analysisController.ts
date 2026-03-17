import { Request, Response } from 'express';
import { generateNarrative } from '../services/aiService';

/**
 * POST /api/analysis/narrative
 * Generar narrativa financiera usando IA
 * Requiere autenticación
 */
export async function createNarrative(req: Request, res: Response): Promise<void> {
  try {
    const { transactions } = req.body;

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

    // Generar narrativa con IA
    const startTime = Date.now();
    const narrative = await generateNarrative(transactions);
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
          model: 'gemini-1.5-flash'
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
