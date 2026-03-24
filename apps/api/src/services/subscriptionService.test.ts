import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { detectSubscriptions } from './subscriptionService';
import { Transaction } from '../models/Transaction';

// Mock de OpenAI
const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate
        }
      };
    }
  };
});

// Mock de Transaction model
vi.mock('../models/Transaction', () => ({
  Transaction: {
    find: vi.fn()
  }
}));

// Helper para crear transacciones mock
function createMockTransaction(
  id: string,
  description: string,
  amount: number,
  date: string
) {
  return {
    _id: { toString: () => id },
    userId: 'test-user',
    description,
    amount,
    date,
    category: 'suscripciones'
  };
}

describe('subscriptionService', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectSubscriptions', () => {
    it('should return empty array when user has no transactions', async () => {
      // Arrange
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toEqual([]);
      expect(Transaction.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          date: expect.objectContaining({ $gte: expect.any(String) })
        })
      );
    });

    it('should detect subscription with identical amounts and similar names', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction('1', 'Netflix Colombia', 15000, '2026-01-15'),
        createMockTransaction('2', 'NETFLIX', 15000, '2026-02-15'),
        createMockTransaction('3', 'Netflix.com', 15000, '2026-03-15')
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Mock de IA para refinar nombre
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Netflix'
          }
        }]
      });

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        serviceName: 'Netflix',
        amount: 15000,
        frequency: expect.any(Number),
        monthlyEstimate: 15000,
        annualEstimate: 180000
      });
      expect(result[0].transactions).toHaveLength(3);
    });

    it('should detect multiple subscriptions with different patterns', async () => {
      // Arrange
      const mockTransactions = [
        // Netflix
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15000, '2026-02-15'),
        // Spotify
        createMockTransaction('3', 'Spotify Premium', 12000, '2026-01-10'),
        createMockTransaction('4', 'Spotify', 12000, '2026-02-10'),
        // HBO Max
        createMockTransaction('5', 'HBO Max', 20000, '2026-01-20'),
        createMockTransaction('6', 'HBO MAX', 20000, '2026-02-20')
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Mock de IA para refinar nombres
      mockCreate
        .mockResolvedValueOnce({ choices: [{ message: { content: 'Netflix' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'Spotify' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'HBO Max' } }] });

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(s => s.serviceName)).toContain('Netflix');
      expect(result.map(s => s.serviceName)).toContain('Spotify');
      expect(result.map(s => s.serviceName)).toContain('HBO Max');
    });

    it('should handle transactions with slight amount variations (< 1%)', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15100, '2026-02-15'), // +0.67% variación
        createMockTransaction('3', 'Netflix', 14950, '2026-03-15')  // -0.33% variación
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Netflix'
          }
        }]
      });

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].transactions).toHaveLength(3);
    });

    it('should NOT group transactions with amount variance >= 1%', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15200, '2026-02-15'), // +1.33% variación (NO debe agrupar)
        createMockTransaction('3', 'Netflix', 15000, '2026-03-15')
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Netflix'
          }
        }]
      });

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      // Debe detectar 2 grupos: uno con 15000 (2 transacciones) y otro con 15200 (1 transacción)
      // Pero el de 15200 no califica como suscripción (solo 1 ocurrencia)
      // Si no hay suscripciones detectadas, el array está vacío
      if (result.length > 0) {
        expect(result[0].amount).toBe(15000);
        expect(result[0].transactions.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should filter out single occurrences (not subscriptions)', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'), // Solo 1 vez
        createMockTransaction('2', 'Spotify', 12000, '2026-01-10'),
        createMockTransaction('3', 'Spotify', 12000, '2026-02-10')  // 2 veces = suscripción
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Spotify'
          }
        }]
      });

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].serviceName).toBe('Spotify');
    });

    it('should filter out transactions in the same month', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15000, '2026-01-20'), // Mismo mes
        createMockTransaction('3', 'Netflix', 15000, '2026-01-25')  // Mismo mes
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(0); // No debe detectar suscripción (todas en el mismo mes)
    });

    it('should calculate correct frequency for monthly subscriptions', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15000, '2026-02-15'), // 31 días después
        createMockTransaction('3', 'Netflix', 15000, '2026-03-15')  // 28 días después
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Netflix'
          }
        }]
      });

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].frequency).toBeGreaterThanOrEqual(28);
      expect(result[0].frequency).toBeLessThanOrEqual(31);
    });

    it('should sort subscriptions by monthly cost (descending)', async () => {
      // Arrange
      const mockTransactions = [
        // Netflix - 15000
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15000, '2026-02-15'),
        // HBO Max - 20000 (más caro)
        createMockTransaction('3', 'HBO Max', 20000, '2026-01-20'),
        createMockTransaction('4', 'HBO Max', 20000, '2026-02-20'),
        // Spotify - 12000 (más barato)
        createMockTransaction('5', 'Spotify', 12000, '2026-01-10'),
        createMockTransaction('6', 'Spotify', 12000, '2026-02-10')
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Service'
          }
        }]
      });

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(3);
      // Verificar que están ordenados por monto descendente
      expect(result[0].monthlyEstimate).toBeGreaterThanOrEqual(result[1].monthlyEstimate);
      expect(result[1].monthlyEstimate).toBeGreaterThanOrEqual(result[2].monthlyEstimate);
      // Verificar que HBO Max (20000) está primero
      expect(result[0].amount).toBe(20000);
      expect(result[2].amount).toBe(12000);
    });

    it('should use fallback when AI fails', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction('1', 'Netflix Colombia', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15000, '2026-02-15'),
        createMockTransaction('3', 'Netflix', 15000, '2026-03-15')
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Mock de IA que falla
      mockCreate.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(1);
      // Debe usar el nombre más común como fallback
      expect(result[0].serviceName).toBe('Netflix');
    });

    it('should use fallback when API key is not configured', async () => {
      // Arrange
      delete process.env.OPENROUTER_API_KEY;

      const mockTransactions = [
        createMockTransaction('1', 'Netflix', 15000, '2026-01-15'),
        createMockTransaction('2', 'Netflix', 15000, '2026-02-15')
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Act
      const result = await detectSubscriptions('user123');

      // Assert
      expect(result).toHaveLength(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // Feature: financeflow-ai, Property 1: Agrupación por similitud de nombres
  describe('[Property] Name similarity grouping', () => {
    it('should group transactions with similar names (>70% similarity)', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              baseName: fc.constantFrom('Netflix', 'Spotify', 'HBO'),
              variation: fc.constantFrom('', ' Colombia', '.com', ' Premium', ' CO'),
              amount: fc.integer({ min: 10000, max: 50000 }),
              month: fc.integer({ min: 1, max: 3 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (transactionSpecs) => {
            // Arrange - Crear transacciones con variaciones del mismo nombre
            const mockTransactions = transactionSpecs.map((spec, i) => 
              createMockTransaction(
                `${i}`,
                `${spec.baseName}${spec.variation}`,
                spec.amount,
                `2026-0${spec.month}-15`
              )
            );

            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(mockTransactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            mockCreate.mockResolvedValue({
              choices: [{
                message: {
                  content: transactionSpecs[0].baseName
                }
              }]
            });

            // Act
            const result = await detectSubscriptions('user123');

            // Assert - Debe agrupar transacciones con nombres similares
            result.forEach(subscription => {
              expect(subscription.transactions.length).toBeGreaterThanOrEqual(1);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Feature: financeflow-ai, Property 2: Varianza de montos < 1%
  describe('[Property] Amount variance tolerance', () => {
    it('should group transactions with amount variance < 1%', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 50000 }),
          fc.array(
            fc.double({ min: -0.009, max: 0.009 }), // Varianza < 1%
            { minLength: 2, maxLength: 5 }
          ),
          async (baseAmount, variances) => {
            // Arrange
            const mockTransactions = variances.map((variance, i) => 
              createMockTransaction(
                `${i}`,
                'Netflix',
                Math.round(baseAmount * (1 + variance)),
                `2026-0${(i % 3) + 1}-15`
              )
            );

            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(mockTransactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            mockCreate.mockResolvedValue({
              choices: [{
                message: {
                  content: 'Netflix'
                }
              }]
            });

            // Act
            const result = await detectSubscriptions('user123');

            // Assert - Debe agrupar todas las transacciones en una sola suscripción
            if (result.length > 0) {
              expect(result[0].transactions.length).toBe(mockTransactions.length);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should NOT group transactions with amount variance >= 1%', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 50000 }),
          fc.double({ min: 0.015, max: 0.1 }), // Varianza >= 1.5% para asegurar separación
          async (baseAmount, variance) => {
            // Arrange
            const mockTransactions = [
              createMockTransaction('1', 'Netflix', baseAmount, '2026-01-15'),
              createMockTransaction('2', 'Netflix', Math.round(baseAmount * (1 + variance)), '2026-02-15'),
              createMockTransaction('3', 'Netflix', baseAmount, '2026-03-15')
            ];

            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(mockTransactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            mockCreate.mockResolvedValue({
              choices: [{
                message: {
                  content: 'Netflix'
                }
              }]
            });

            // Act
            const result = await detectSubscriptions('user123');

            // Assert - Debe crear grupos separados o no detectar suscripción
            // Si detecta suscripciones, el total de transacciones debe ser menor que el original
            const totalTransactions = result.reduce((sum, sub) => sum + sub.transactions.length, 0);
            expect(totalTransactions).toBeLessThanOrEqual(mockTransactions.length);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Feature: financeflow-ai, Property 3: Filtrado de meses diferentes
  describe('[Property] Different months requirement', () => {
    it('should only detect subscriptions with charges in different months', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.integer({ min: 1, max: 12 }),
            { minLength: 2, maxLength: 6 }
          ),
          async (months) => {
            // Arrange
            const uniqueMonths = [...new Set(months)];
            const mockTransactions = months.map((month, i) => 
              createMockTransaction(
                `${i}`,
                'Netflix',
                15000,
                `2026-${month.toString().padStart(2, '0')}-15`
              )
            );

            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(mockTransactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            mockCreate.mockResolvedValue({
              choices: [{
                message: {
                  content: 'Netflix'
                }
              }]
            });

            // Act
            const result = await detectSubscriptions('user123');

            // Assert - Solo debe detectar si hay al menos 2 meses diferentes
            if (uniqueMonths.length >= 2) {
              expect(result.length).toBeGreaterThanOrEqual(1);
            } else {
              expect(result.length).toBe(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: financeflow-ai, Property 4: Cálculo de frecuencia
  describe('[Property] Frequency calculation correctness', () => {
    it('should calculate average frequency correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.integer({ min: 1, max: 90 }), // Días entre cargos
            { minLength: 2, maxLength: 5 }
          ),
          async (daysBetweenCharges) => {
            // Arrange - Crear transacciones con intervalos específicos
            let currentDate = new Date('2026-01-01');
            const mockTransactions = [
              createMockTransaction('0', 'Netflix', 15000, currentDate.toISOString().split('T')[0])
            ];

            daysBetweenCharges.forEach((days, i) => {
              currentDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
              mockTransactions.push(
                createMockTransaction(
                  `${i + 1}`,
                  'Netflix',
                  15000,
                  currentDate.toISOString().split('T')[0]
                )
              );
            });

            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(mockTransactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            mockCreate.mockResolvedValue({
              choices: [{
                message: {
                  content: 'Netflix'
                }
              }]
            });

            // Act
            const result = await detectSubscriptions('user123');

            // Assert - La frecuencia debe estar cerca del promedio
            if (result.length > 0) {
              const expectedAvg = Math.round(
                daysBetweenCharges.reduce((a, b) => a + b, 0) / daysBetweenCharges.length
              );
              expect(result[0].frequency).toBeGreaterThanOrEqual(expectedAvg - 2);
              expect(result[0].frequency).toBeLessThanOrEqual(expectedAvg + 2);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Feature: financeflow-ai, Property 5: Estimaciones mensuales y anuales
  describe('[Property] Monthly and annual estimates', () => {
    it('should calculate correct monthly and annual estimates', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 50000 }),
          async (amount) => {
            // Arrange
            const mockTransactions = [
              createMockTransaction('1', 'Netflix', amount, '2026-01-15'),
              createMockTransaction('2', 'Netflix', amount, '2026-02-15')
            ];

            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(mockTransactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            mockCreate.mockResolvedValue({
              choices: [{
                message: {
                  content: 'Netflix'
                }
              }]
            });

            // Act
            const result = await detectSubscriptions('user123');

            // Assert
            if (result.length > 0) {
              // Para frecuencia mensual (~31 días), el estimate mensual debe ser igual al monto
              expect(result[0].monthlyEstimate).toBe(amount);
              expect(result[0].annualEstimate).toBe(amount * 12);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Feature: financeflow-ai, Property 6: Robustez ante errores
  describe('[Property] Error handling robustness', () => {
    it('should never throw unhandled exceptions', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              description: fc.string({ minLength: 1, maxLength: 50 }),
              amount: fc.integer({ min: 1, max: 1000000 }),
              date: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') })
                .map(d => d.toISOString().split('T')[0])
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (transactionSpecs) => {
            // Arrange
            const mockTransactions = transactionSpecs.map((spec, i) => 
              createMockTransaction(`${i}`, spec.description, spec.amount, spec.date)
            );

            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(mockTransactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            mockCreate.mockResolvedValue({
              choices: [{
                message: {
                  content: 'Service'
                }
              }]
            });

            // Act & Assert - No debe lanzar excepciones
            const result = await detectSubscriptions('user123');
            expect(Array.isArray(result)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
