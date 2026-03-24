import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { extractTransactionsFromText } from '../services/aiService';
import { savingsPlanService } from '../services/savingsPlanService';

/**
 * GET /api/transactions
 * Obtener todas las transacciones del usuario autenticado
 */
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        transactions,
        count: transactions.length
      }
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener transacciones'
      }
    });
  }
};

/**
 * POST /api/transactions
 * Crear una nueva transacción
 */
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { description, amount, date, category, merchant } = req.body;

    // Validar campos requeridos
    if (!description || !amount || !date) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Faltan campos requeridos: description, amount, date'
        }
      });
      return;
    }

    // Crear transacción
    const transaction = await Transaction.create({
      userId,
      description,
      amount: Number(amount),
      date,
      category: category || 'misceláneos',
      merchant: merchant || description.split(' ')[0],
      isMicroExpense: Number(amount) <= 50000 // Gastos hormiga <= 50k COP
    });

    // Actualizar plan de ahorro si existe para esta categoría
    try {
      await savingsPlanService.updatePlanAmount(
        userId,
        transaction.category || 'misceláneos',
        transaction.amount
      );
    } catch (planError) {
      console.error('Error al actualizar plan de ahorro:', planError);
      // No fallar la creación de transacción si falla la actualización del plan
    }

    res.status(201).json({
      success: true,
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al crear transacción'
      }
    });
  }
};

/**
 * POST /api/transactions/bulk
 * Crear múltiples transacciones (para CSV upload)
 */
export const createBulkTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    const { transactions } = req.body;

    // Validar que sea un array
    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Se requiere un array de transacciones'
        }
      });
      return;
    }

    // Validar y preparar transacciones
    const validTransactions = transactions
      .filter(t => t.description && t.amount && t.date)
      .map(t => ({
        userId,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        category: t.category || 'misceláneos',
        merchant: t.merchant || t.description.split(' ')[0],
        isMicroExpense: Number(t.amount) <= 50000
      }));

    if (validTransactions.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_VALID_TRANSACTIONS',
          message: 'No se encontraron transacciones válidas'
        }
      });
      return;
    }

    // Insertar en bulk
    const created = await Transaction.insertMany(validTransactions);

    // Actualizar planes de ahorro para cada transacción
    try {
      for (const transaction of created) {
        await savingsPlanService.updatePlanAmount(
          userId,
          transaction.category,
          transaction.amount
        );
      }
    } catch (planError) {
      console.error('Error al actualizar planes de ahorro:', planError);
      // No fallar la importación si falla la actualización de planes
    }

    res.status(201).json({
      success: true,
      data: {
        count: created.length,
        transactions: created
      }
    });
  } catch (error) {
    console.error('Error al crear transacciones en bulk:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al importar transacciones'
      }
    });
  }
};

/**
 * DELETE /api/transactions/:id
 * Eliminar una transacción
 */
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId
    });

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transacción no encontrada'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Transacción eliminada'
      }
    });
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al eliminar transacción'
      }
    });
  }
};

/**
 * POST /api/transactions/quick-add
 * Agregar transacciones usando lenguaje natural (IA)
 * Ejemplo: "15k en almuerzo, 50 lucas de gasolina y ayer 200 en arriendo"
 */
export const quickAddTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { text } = req.body;

    // Validar que haya texto
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TEXT',
          message: 'Se requiere el campo "text" con la descripción de los gastos'
        }
      });
      return;
    }

    // Extraer transacciones usando IA
    let extractedTransactions;
    try {
      extractedTransactions = await extractTransactionsFromText(text);
    } catch (aiError) {
      console.error('Error al extraer transacciones con IA:', aiError);
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_EXTRACTION_ERROR',
          message: 'No se pudieron extraer transacciones del texto. Intenta ser más específico.'
        }
      });
      return;
    }

    if (extractedTransactions.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_TRANSACTIONS_FOUND',
          message: 'No se encontraron transacciones en el texto. Intenta con un formato como: "15k en almuerzo, 50 lucas de gasolina"'
        }
      });
      return;
    }

    // Preparar transacciones para insertar
    const transactionsToInsert = extractedTransactions.map(t => ({
      userId,
      description: t.description,
      amount: t.amount,
      date: t.date,
      category: t.category || 'misceláneos',
      merchant: t.description.split(' ')[0],
      isMicroExpense: t.amount <= 50000
    }));

    // Insertar en bulk
    const created = await Transaction.insertMany(transactionsToInsert);

    // Actualizar planes de ahorro para cada transacción
    try {
      for (const transaction of created) {
        await savingsPlanService.updatePlanAmount(
          userId,
          transaction.category,
          transaction.amount
        );
      }
    } catch (planError) {
      console.error('Error al actualizar planes de ahorro:', planError);
      // No fallar el quick-add si falla la actualización de planes
    }

    res.status(201).json({
      success: true,
      data: {
        count: created.length,
        transactions: created,
        message: `${created.length} ${created.length === 1 ? 'transacción agregada' : 'transacciones agregadas'} exitosamente`
      }
    });

  } catch (error) {
    console.error('Error en quick-add:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al procesar las transacciones'
      }
    });
  }
};
