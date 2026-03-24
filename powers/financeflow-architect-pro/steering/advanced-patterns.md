# Advanced Patterns for FinanceFlow Architect Pro

Este steering file contiene patrones avanzados y casos de uso complejos para el Power FinanceFlow Architect Pro.

## Pattern 1: Slice con Integración de IA (Gemini)

Cuando un Slice requiere integración con Google Gemini Flash para generar narrativas.

### Investigación Requerida

Antes de generar código, investiga:
```
"mejores prácticas google gemini api nodejs 2026"
"gemini flash rate limiting handling"
"gemini api error handling patterns"
```

### Estructura de Código

**Service Layer (`apps/api/src/services/aiService.ts`):**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-flash' });

export async function generateNarrative(data: NarrativeInput): Promise<string> {
  // Rate limiting
  await rateLimiter.check();
  
  // Anonimizar datos antes de enviar
  const anonymized = anonymizeData(data);
  
  // Prompt engineering
  const prompt = buildPrompt(anonymized);
  
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    // Fallback a templates
    return generateFallbackNarrative(data);
  }
}
```

**Tests con Mocks:**
```typescript
import { vi } from 'vitest';
import { generateNarrative } from './aiService';

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() => ({
        response: { text: () => 'Mocked narrative' }
      }))
    }))
  }))
}));

describe('aiService', () => {
  it('should generate narrative', async () => {
    const result = await generateNarrative({ category: 'café', amount: 50000 });
    expect(result).toBeTruthy();
  });
});
```

### Validaciones de Seguridad

- ✅ No enviar datos personales identificables (nombres, emails)
- ✅ Anonimizar transacciones (solo categoría, monto, frecuencia)
- ✅ Rate limiting para evitar exceder cuotas
- ✅ Timeout de 5 segundos máximo
- ✅ Fallback a templates si la API falla

## Pattern 2: Slice con Agregaciones MongoDB

Cuando un Slice requiere análisis complejos con MongoDB aggregation pipeline.

### Investigación Requerida

```
"mongodb aggregation pipeline best practices 2026"
"mongoose aggregation typescript"
"mongodb performance optimization indexes"
```

### Estructura de Código

**Service con Aggregation:**
```typescript
export async function analyzeSpendingPatterns(userId: string) {
  const patterns = await Transaction.aggregate([
    // Stage 1: Filtrar por usuario y gastos hormiga
    { 
      $match: { 
        userId: new ObjectId(userId), 
        isMicroExpense: true 
      } 
    },
    
    // Stage 2: Agrupar por merchant
    { 
      $group: {
        _id: '$merchant',
        frequency: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        transactions: { $push: '$$ROOT' }
      }
    },
    
    // Stage 3: Calcular impacto anual
    {
      $addFields: {
        annualImpact: { $multiply: ['$totalAmount', 12] }
      }
    },
    
    // Stage 4: Ordenar por impacto
    { $sort: { annualImpact: -1 } },
    
    // Stage 5: Limitar resultados
    { $limit: 10 }
  ]);
  
  return patterns;
}
```

**Índices Requeridos:**
```typescript
// En el Schema
transactionSchema.index({ userId: 1, isMicroExpense: 1, merchant: 1 });
transactionSchema.index({ userId: 1, date: -1 });
```

**Property-Based Tests:**
```typescript
import fc from 'fast-check';

describe('analyzeSpendingPatterns', () => {
  it('should always return sorted results by annualImpact', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          merchant: fc.string(),
          amount: fc.integer({ min: 1000, max: 50000 }),
          frequency: fc.integer({ min: 1, max: 30 })
        })),
        async (transactions) => {
          // Setup test data
          await setupTestTransactions(transactions);
          
          // Execute
          const result = await analyzeSpendingPatterns(testUserId);
          
          // Verify sorting
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].annualImpact).toBeGreaterThanOrEqual(
              result[i + 1].annualImpact
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

## Pattern 3: Slice con Animaciones Complejas (Framer Motion)

Cuando un Slice requiere animaciones impactantes para crear momentos "wow".

### Investigación Requerida

```
"framer motion best practices 2026"
"framer motion performance optimization"
"react animation patterns"
```

### Estructura de Código

**Variantes Reutilizables (`packages/ui/animations/`):**
```typescript
// packages/ui/animations/celebrationVariants.ts
export const celebrationVariants = {
  hidden: { 
    scale: 0,
    opacity: 0,
    rotate: -180
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      duration: 0.6
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    rotate: 180,
    transition: { duration: 0.3 }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
```

**Componente con Animación:**
```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { celebrationVariants, staggerContainer } from '@financeflow/ui/animations';

export function MilestoneCard({ milestone, index }: Props) {
  return (
    <motion.div
      variants={celebrationVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      className="rounded-lg bg-gradient-to-br from-green-400 to-blue-500 p-6"
    >
      <motion.h3
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-white"
      >
        {milestone.title}
      </motion.h3>
      
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {milestone.achievements.map((achievement, i) => (
          <motion.div
            key={i}
            variants={celebrationVariants}
            className="mt-2"
          >
            {achievement}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
```

**Performance Optimization:**
```typescript
// Usar layoutId para smooth transitions
<motion.div layoutId={`card-${id}`}>

// Usar will-change para animaciones complejas
<motion.div style={{ willChange: 'transform' }}>

// Lazy load animaciones pesadas
const HeavyAnimation = lazy(() => import('./HeavyAnimation'));
```

## Pattern 4: Slice con Cumplimiento de Ley 1581

Cuando un Slice maneja datos personales y requiere cumplimiento legal.

### Investigación Requerida

```
"ley 1581 colombia implementación técnica"
"gdpr compliance nodejs"
"data encryption best practices"
```

### Estructura de Código

**Middleware de Consentimiento:**
```typescript
// apps/api/src/middleware/consentMiddleware.ts
export async function requireConsent(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = await User.findById(userId);
  
  if (!user?.consent?.dataProcessing) {
    return res.status(403).json({ 
      error: 'Consent required',
      message: 'Debe aceptar el procesamiento de datos personales'
    });
  }
  
  // Log de acceso para auditoría
  await AuditLog.create({
    userId,
    action: 'data_access',
    resource: req.path,
    timestamp: new Date(),
    ipAddress: req.ip
  });
  
  next();
}
```

**Schema con Encriptación:**
```typescript
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    set: (value: string) => encrypt(value), // Encriptar al guardar
    get: (value: string) => decrypt(value)  // Desencriptar al leer
  },
  consent: {
    dataProcessing: { type: Boolean, default: false },
    acceptedAt: Date,
    ipAddress: String,
    version: String // Versión de términos aceptados
  }
}, {
  timestamps: true,
  toJSON: { getters: true }
});

function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

**Endpoint de Derechos ARCO:**
```typescript
// apps/api/src/routes/privacyRoutes.ts
router.get('/privacy/my-data', authMiddleware, async (req, res) => {
  // Derecho de Acceso
  const userData = await User.findById(req.user.id).lean();
  const transactions = await Transaction.find({ userId: req.user.id }).lean();
  
  res.json({
    personalData: userData,
    transactions,
    exportedAt: new Date()
  });
});

router.delete('/privacy/delete-account', authMiddleware, async (req, res) => {
  // Derecho de Cancelación
  await User.findByIdAndDelete(req.user.id);
  await Transaction.deleteMany({ userId: req.user.id });
  
  res.json({ message: 'Cuenta eliminada exitosamente' });
});
```

## Pattern 5: Slice con Real-Time Updates (WebSockets)

Cuando un Slice requiere actualizaciones en tiempo real.

### Investigación Requerida

```
"socket.io express typescript best practices"
"websocket authentication jwt"
"socket.io rooms namespaces"
```

### Estructura de Código

**Server Setup:**
```typescript
// apps/api/src/server.ts
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Middleware de autenticación
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Namespace para notificaciones
const notificationsNamespace = io.of('/notifications');

notificationsNamespace.on('connection', (socket) => {
  const userId = socket.data.userId;
  
  // Join a room específico del usuario
  socket.join(`user:${userId}`);
  
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

export { io, notificationsNamespace };
```

**Service que Emite Eventos:**
```typescript
// apps/api/src/services/notificationService.ts
import { notificationsNamespace } from '../server';

export async function sendNotification(userId: string, notification: Notification) {
  // Guardar en DB
  await Notification.create({
    userId,
    ...notification
  });
  
  // Emitir evento en tiempo real
  notificationsNamespace
    .to(`user:${userId}`)
    .emit('new-notification', notification);
}
```

**Frontend Hook:**
```typescript
// apps/web/hooks/useRealtimeNotifications.ts
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useRealtimeNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to notifications');
    });
    
    newSocket.on('new-notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);
  
  return { notifications, socket };
}
```

## Pattern 6: Slice con Caching Estratégico (Redis)

Cuando un Slice requiere caching para mejorar performance.

### Investigación Requerida

```
"redis caching strategies nodejs"
"redis cache invalidation patterns"
"ioredis typescript best practices"
```

### Estructura de Código

**Redis Client Setup:**
```typescript
// apps/api/src/config/redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});
```

**Cache Decorator:**
```typescript
// apps/api/src/utils/cache.ts
import { redis } from '../config/redis';

export function Cacheable(ttl: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      
      // Intentar obtener del cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Ejecutar método original
      const result = await originalMethod.apply(this, args);
      
      // Guardar en cache
      await redis.setex(cacheKey, ttl, JSON.stringify(result));
      
      return result;
    };
    
    return descriptor;
  };
}
```

**Service con Caching:**
```typescript
// apps/api/src/services/statsService.ts
import { Cacheable } from '../utils/cache';

export class StatsService {
  @Cacheable(1800) // 30 minutos
  async getMonthlyStats(userId: string, month: string) {
    // Query pesado a MongoDB
    const stats = await Transaction.aggregate([
      // ... aggregation pipeline complejo
    ]);
    
    return stats;
  }
  
  async invalidateStatsCache(userId: string) {
    // Invalidar cache cuando hay nuevas transacciones
    const pattern = `getMonthlyStats:*${userId}*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

## Checklist de Calidad para Slices

Antes de considerar un Slice completo, verifica:

### Backend
- [ ] Model con schema de Mongoose y validación estricta
- [ ] Índices en campos de búsqueda frecuente
- [ ] Service con lógica de negocio separada
- [ ] Controller con manejo de errores
- [ ] Routes con middleware de autenticación
- [ ] Tests unitarios con >80% coverage
- [ ] Property-based tests para validar correctness

### Shared
- [ ] Interfaces TypeScript exportadas
- [ ] Types compartidos entre frontend y backend
- [ ] Validaciones con Zod si aplica
- [ ] Documentación de types con JSDoc

### Frontend
- [ ] Custom hook con TanStack Query
- [ ] Componentes con Framer Motion
- [ ] Responsive design con Tailwind
- [ ] Manejo de estados de loading/error
- [ ] Tests de componentes con >70% coverage

### Calidad
- [ ] Todos los tests pasan
- [ ] No hay errores de TypeScript
- [ ] Linter sin warnings
- [ ] Código formateado con Prettier
- [ ] Cumplimiento de Ley 1581 si maneja datos personales

### Documentación
- [ ] agents.md actualizado con nuevos patrones
- [ ] SLICE-N-TESTING.md creado
- [ ] README actualizado si hay nuevos endpoints
- [ ] Comentarios en código complejo

---

**Usa estos patrones como referencia al crear Slices complejos con FinanceFlow Architect Pro.**
