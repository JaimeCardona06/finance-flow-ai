// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
import path from 'path';

// Especificar ruta explícita del .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db';
import { initializeJobs, stopAllJobs } from './jobs';
import authRoutes from './routes/authRoutes';
import analysisRoutes from './routes/analysisRoutes';
import transactionRoutes from './routes/transactionRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import statsRoutes from './routes/statsRoutes';
import savingsPlanRoutes from './routes/savingsPlanRoutes';
import exportRoutes from './routes/exportRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middlewares de seguridad
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'FinanceFlow AI API is running',
    timestamp: new Date().toISOString()
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/plans', savingsPlanRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint no encontrado'
    }
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Inicializar cron jobs después de MongoDB
    initializeJobs();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

// Manejo de shutdown graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  stopAllJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  stopAllJobs();
  process.exit(0);
});
