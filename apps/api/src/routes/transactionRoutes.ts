import { Router } from 'express';
import { 
  getTransactions, 
  createTransaction, 
  createBulkTransactions,
  deleteTransaction,
  quickAddTransactions
} from '../controllers/transactionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/transactions - Obtener todas las transacciones del usuario
router.get('/', getTransactions);

// POST /api/transactions - Crear una transacción
router.post('/', createTransaction);

// POST /api/transactions/quick-add - Agregar transacciones con lenguaje natural (IA)
router.post('/quick-add', quickAddTransactions);

// POST /api/transactions/bulk - Crear múltiples transacciones (CSV upload)
router.post('/bulk', createBulkTransactions);

// DELETE /api/transactions/:id - Eliminar una transacción
router.delete('/:id', deleteTransaction);

export default router;
