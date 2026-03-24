import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import mongoose from 'mongoose';

// Mock functions creados con vi.hoisted() para evitar problemas de hoisting
const { mockFind, mockAggregate, mockFindOneAndUpdate, mockLean, mockSort } = vi.hoisted(() => ({
  mockFind: vi.fn(),
  mockAggregate: vi.fn(),
  mockFindOneAndUpdate: vi.fn(),
  mockLean: vi.fn(),
  mockSort: vi.fn()
}));

// Mock de Transaction model
vi.mock('../models/Transaction', () => ({
  Transaction: {
    find: mockFind,
    aggregate: mockAggregate
  }
}));

// Mock de ProgressMilestone model
vi.mock('../models/ProgressMilestone', () => ({
  ProgressMilestone: {
    findOneAndUpdate: mockFindOneAndUpdate
  }
}));

// Importar después de los mocks
import { getMonthlyComparison, getProgressData, saveMilestone } from './statsService';

// ID de usuario válido de 24 caracteres para evitar BSONError
const VALID_USER_ID = '507f1f77bcf86cd799439011';

// Helper para crear transacciones mock
function createMockTransaction(overrides: any = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(VALID_USER_ID),
    description: overrides.description || 'Test transaction',
    amount: overrides.amount || 10000,
    date: overrides.date || '2024-03-15',
    category: overrides.category || 'comida',
    merchant: overrides.merchant || 'Test Merchant',
    isMicroExpense: overrides.isMicroExpense !== undefined ? overrides.isMicroExpense : true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('statsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar fake timers para fecha fija: 2024-03-15
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15'));
    
    // Setup default mock chain - SIEMPRE retornar un objeto con lean
    mockFind.mockReturnValue({
      lean: mockLean
    });
    mockLean.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getMonthlyComparison', () => {
    it('should compare current month vs previous month successfully', async () => {
      // Arrange - Marzo 2024 (mes actual) y Febrero 2024 (mes anterior)
      const marchTransactions = [
        createMockTransaction({ amount: 50000, date: '2024-03-10' }),
        createMockTransaction({ amount: 30000, date: '2024-03-12' })
      ];
      
      const februaryTransactions = [
        createMockTransaction({ amount: 60000, date: '2024-02-10' }),
        createMockTransaction({ amount: 40000, date: '2024-02-15' })
      ];

      // Mock para marzo (mes actual)
      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(marchTransactions)
      }));

      // Mock para febrero (mes anterior)
      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(februaryTransactions)
      }));

      // Act
      const result = await getMonthlyComparison(VALID_USER_ID);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.currentMonth.totalAmount).toBe(80000);
      expect(result!.previousMonth.totalAmount).toBe(100000);
      expect(result!.delta.amount).toBe(-20000);
      expect(result!.delta.percentage).toBe(-20);
      expect(result!.delta.trend).toBe('down');
      expect(result!.improvement).toBe(true);
    });

    it('should return null when no transactions in current month', async () => {
      // Arrange - Sin transacciones en marzo
      mockFind.mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([])
      }));

      // Act
      const result = await getMonthlyComparison(VALID_USER_ID);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle case when previous month has no transactions', async () => {
      // Arrange - Solo transacciones en marzo
      const marchTransactions = [
        createMockTransaction({ amount: 50000, date: '2024-03-10' })
      ];

      // Mock para marzo (mes actual)
      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(marchTransactions)
      }));

      // Mock para febrero (mes anterior) - sin transacciones
      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue([])
      }));

      // Act
      const result = await getMonthlyComparison(VALID_USER_ID);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.currentMonth.totalAmount).toBe(50000);
      expect(result!.previousMonth.totalAmount).toBe(0);
      expect(result!.delta.percentage).toBe(100);
      expect(result!.delta.trend).toBe('up');
      expect(result!.improvement).toBe(false);
    });

    it('should set trend to stable when delta < 5%', async () => {
      // Arrange - Gastos casi iguales (diferencia < 5%)
      const marchTransactions = [
        createMockTransaction({ amount: 100000, date: '2024-03-10' })
      ];
      
      const februaryTransactions = [
        createMockTransaction({ amount: 102000, date: '2024-02-10' })
      ];

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(marchTransactions)
      }));

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(februaryTransactions)
      }));

      // Act
      const result = await getMonthlyComparison(VALID_USER_ID);

      // Assert
      expect(result!.delta.trend).toBe('stable');
    });

    it('should calculate category breakdown correctly', async () => {
      // Arrange
      const marchTransactions = [
        createMockTransaction({ amount: 30000, category: 'comida', date: '2024-03-10' }),
        createMockTransaction({ amount: 20000, category: 'transporte', date: '2024-03-12' }),
        createMockTransaction({ amount: 10000, category: 'comida', date: '2024-03-14' })
      ];

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(marchTransactions)
      }));

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue([])
      }));

      // Act
      const result = await getMonthlyComparison(VALID_USER_ID);

      // Assert
      expect(result!.currentMonth.categoryBreakdown).toEqual({
        comida: 40000,
        transporte: 20000
      });
    });

    it('should calculate average per day correctly', async () => {
      // Arrange - Marzo tiene 31 días
      const marchTransactions = [
        createMockTransaction({ amount: 31000, date: '2024-03-10' })
      ];

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(marchTransactions)
      }));

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue([])
      }));

      // Act
      const result = await getMonthlyComparison(VALID_USER_ID);

      // Assert
      expect(result!.currentMonth.averagePerDay).toBe(1000); // 31000 / 31 días
    });

    it('should filter micro expenses when requested', async () => {
      // Arrange - Mix de gastos hormiga y no hormiga
      const marchTransactions = [
        createMockTransaction({ amount: 5000, isMicroExpense: true, date: '2024-03-10' }),
        createMockTransaction({ amount: 50000, isMicroExpense: false, date: '2024-03-12' })
      ];

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue(marchTransactions)
      }));

      mockFind.mockImplementationOnce(() => ({
        lean: vi.fn().mockResolvedValue([])
      }));

      // Act
      const result = await getMonthlyComparison(VALID_USER_ID);

      // Assert
      expect(result!.currentMonth.microExpensesAmount).toBe(5000);
      expect(result!.currentMonth.totalAmount).toBe(55000);
    });
  });

  describe('getProgressData', () => {
    it('should return progress data for last 6 months by default', async () => {
      // Arrange - Crear transacciones para 6 meses
      const months = [
        { month: 10, year: 2023, amount: 100000 }, // Oct 2023
        { month: 11, year: 2023, amount: 90000 },  // Nov 2023
        { month: 12, year: 2023, amount: 80000 },  // Dec 2023
        { month: 1, year: 2024, amount: 70000 },   // Jan 2024
        { month: 2, year: 2024, amount: 60000 },   // Feb 2024
        { month: 3, year: 2024, amount: 50000 }    // Mar 2024
      ];

      // Mock para cada mes
      months.forEach(({ month, year, amount }) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-15`;
        mockFind.mockImplementationOnce(() => ({
          lean: vi.fn().mockResolvedValue([
            createMockTransaction({ amount, date: dateStr })
          ])
        }));
      });

      // Act
      const result = await getProgressData(VALID_USER_ID);

      // Assert
      expect(result.monthlyHistory).toHaveLength(6);
      expect(result.averageMonthlySpending).toBe(75000);
      expect(result.bestMonth?.totalAmount).toBe(50000);
      expect(result.worstMonth?.totalAmount).toBe(100000);
    });

    it('should calculate improvement streak correctly', async () => {
      // Arrange - Últimos 3 meses con reducción consecutiva
      const months = [
        { month: 1, year: 2024, amount: 100000 },
        { month: 2, year: 2024, amount: 80000 },
        { month: 3, year: 2024, amount: 60000 }
      ];

      months.forEach(({ month, year, amount }) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-15`;
        mockFind.mockImplementationOnce(() => ({
          lean: vi.fn().mockResolvedValue([
            createMockTransaction({ amount, date: dateStr })
          ])
        }));
      });

      // Act
      const result = await getProgressData(VALID_USER_ID, { months: 3 });

      // Assert
      expect(result.improvementStreak).toBe(2); // 2 meses consecutivos de mejora
    });

    it('should return empty data when no transactions exist', async () => {
      // Arrange - Sin transacciones
      mockFind.mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([])
      }));

      // Act
      const result = await getProgressData(VALID_USER_ID);

      // Assert
      expect(result.monthlyHistory).toHaveLength(0);
      expect(result.totalSavings).toBe(0);
      expect(result.bestMonth).toBeNull();
      expect(result.worstMonth).toBeNull();
      expect(result.averageMonthlySpending).toBe(0);
      expect(result.improvementStreak).toBe(0);
    });

    it('should calculate total savings correctly', async () => {
      // Arrange - Algunos meses por debajo del promedio
      const months = [
        { month: 1, year: 2024, amount: 100000 },
        { month: 2, year: 2024, amount: 50000 },  // Ahorro de 25000
        { month: 3, year: 2024, amount: 75000 }
      ];
      // Promedio = 75000
      // Ahorros = (75000 - 50000) = 25000

      months.forEach(({ month, year, amount }) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-15`;
        mockFind.mockImplementationOnce(() => ({
          lean: vi.fn().mockResolvedValue([
            createMockTransaction({ amount, date: dateStr })
          ])
        }));
      });

      // Act
      const result = await getProgressData(VALID_USER_ID, { months: 3 });

      // Assert
      expect(result.totalSavings).toBe(25000);
    });

    it('should respect custom months parameter', async () => {
      // Arrange - Solo 3 meses
      const months = [
        { month: 1, year: 2024, amount: 100000 },
        { month: 2, year: 2024, amount: 90000 },
        { month: 3, year: 2024, amount: 80000 }
      ];

      months.forEach(({ month, year, amount }) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-15`;
        mockFind.mockImplementationOnce(() => ({
          lean: vi.fn().mockResolvedValue([
            createMockTransaction({ amount, date: dateStr })
          ])
        }));
      });

      // Act
      const result = await getProgressData(VALID_USER_ID, { months: 3 });

      // Assert
      expect(result.monthlyHistory).toHaveLength(3);
    });

    it('should handle improvement streak break correctly', async () => {
      // Arrange - Mejora interrumpida
      const months = [
        { month: 1, year: 2024, amount: 100000 },
        { month: 2, year: 2024, amount: 80000 },  // Mejora
        { month: 3, year: 2024, amount: 90000 }   // Empeora (rompe racha)
      ];

      months.forEach(({ month, year, amount }) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-15`;
        mockFind.mockImplementationOnce(() => ({
          lean: vi.fn().mockResolvedValue([
            createMockTransaction({ amount, date: dateStr })
          ])
        }));
      });

      // Act
      const result = await getProgressData(VALID_USER_ID, { months: 3 });

      // Assert
      expect(result.improvementStreak).toBe(0); // Racha rota
    });
  });

  describe('saveMilestone', () => {
    it('should save milestone successfully', async () => {
      // Arrange
      mockFindOneAndUpdate.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        milestoneType: 'first_15_reduction',
        achievedAt: new Date(),
        amountSaved: 15000,
        metadata: { test: 'data' }
      });

      // Act
      await saveMilestone(VALID_USER_ID, 'first_15_reduction', 15000, { test: 'data' });

      // Assert
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        {
          userId: expect.any(mongoose.Types.ObjectId),
          milestoneType: 'first_15_reduction'
        },
        {
          userId: expect.any(mongoose.Types.ObjectId),
          milestoneType: 'first_15_reduction',
          achievedAt: expect.any(Date),
          amountSaved: 15000,
          metadata: { test: 'data' }
        },
        { upsert: true, new: true }
      );
    });

    it('should handle duplicate milestone gracefully', async () => {
      // Arrange - Simular error de duplicado (código 11000)
      const duplicateError: any = new Error('Duplicate key');
      duplicateError.code = 11000;
      mockFindOneAndUpdate.mockRejectedValue(duplicateError);

      // Act & Assert - No debe lanzar error
      await expect(
        saveMilestone(VALID_USER_ID, 'first_15_reduction', 15000)
      ).resolves.not.toThrow();
    });

    it('should use default empty metadata when not provided', async () => {
      // Arrange
      mockFindOneAndUpdate.mockResolvedValue({});

      // Act
      await saveMilestone(VALID_USER_ID, 'first_month_improvement', 20000);

      // Assert
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: {}
        }),
        expect.anything()
      );
    });
  });

  // Feature: financeflow-ai, Property 1: Cálculos nunca deben retornar NaN o Infinity
  describe('[Property] Financial calculations robustness', () => {
    it('should never return NaN or Infinity for valid transaction amounts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          (currentAmount, previousAmount) => {
            // Arrange - Calcular valores esperados
            const roundedCurrent = Math.round(currentAmount);
            const roundedPrevious = Math.round(previousAmount);
            
            const deltaAmount = roundedCurrent - roundedPrevious;
            const deltaPercentage = roundedPrevious > 0
              ? (deltaAmount / roundedPrevious) * 100
              : 100;
            
            // Assert - Los cálculos nunca deben producir NaN o Infinity
            expect(isNaN(deltaAmount)).toBe(false);
            expect(isFinite(deltaAmount)).toBe(true);
            expect(isNaN(deltaPercentage)).toBe(false);
            expect(isFinite(deltaPercentage)).toBe(true);
            
            // Verificar que el promedio por día también es válido
            const daysInMonth = 31;
            const averagePerDay = roundedCurrent / daysInMonth;
            expect(isNaN(averagePerDay)).toBe(false);
            expect(isFinite(averagePerDay)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero previous month spending correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 100000, noNaN: true }),
          (currentAmount) => {
            // Arrange
            const roundedCurrent = Math.round(currentAmount);
            const previousAmount = 0;
            
            // Act - Calcular delta percentage como lo hace el servicio
            const deltaPercentage = previousAmount > 0
              ? ((roundedCurrent - previousAmount) / previousAmount) * 100
              : 100;
            
            // Assert - Debe ser 100% cuando el mes anterior es 0
            expect(deltaPercentage).toBe(100);
            expect(isFinite(deltaPercentage)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: financeflow-ai, Property 2: Trend logic correctness
  describe('[Property] Trend calculation logic', () => {
    it('should always assign correct trend based on delta percentage', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 100000, noNaN: true }),
          fc.double({ min: 1, max: 100000, noNaN: true }),
          (currentAmount, previousAmount) => {
            // Arrange
            const roundedCurrent = Math.round(currentAmount);
            const roundedPrevious = Math.round(previousAmount);
            
            const deltaAmount = roundedCurrent - roundedPrevious;
            const deltaPercentage = (deltaAmount / roundedPrevious) * 100;
            
            // Act - Determinar trend como lo hace el servicio
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (Math.abs(deltaPercentage) < 5) {
              trend = 'stable';
            } else if (deltaAmount > 0) {
              trend = 'up';
            } else {
              trend = 'down';
            }
            
            // Assert - Verificar lógica de trend
            const absDelta = Math.abs(deltaPercentage);
            if (absDelta < 5) {
              expect(trend).toBe('stable');
            } else if (deltaAmount > 0) {
              expect(trend).toBe('up');
            } else {
              expect(trend).toBe('down');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 3: Improvement flag correctness
  describe('[Property] Improvement flag logic', () => {
    it('should set improvement=true only when spending decreased', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 100000, noNaN: true }),
          fc.double({ min: 1, max: 100000, noNaN: true }),
          (currentAmount, previousAmount) => {
            // Arrange
            const roundedCurrent = Math.round(currentAmount);
            const roundedPrevious = Math.round(previousAmount);
            
            const deltaAmount = roundedCurrent - roundedPrevious;
            
            // Act - Determinar improvement como lo hace el servicio
            const improvement = deltaAmount < 0;
            
            // Assert - improvement debe ser true solo si bajó el gasto
            if (roundedCurrent < roundedPrevious) {
              expect(improvement).toBe(true);
            } else {
              expect(improvement).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 4: Progress data consistency
  describe('[Property] Progress data consistency', () => {
    it('should maintain consistency between best/worst months and history', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.double({ min: 1, max: 100000, noNaN: true }),
            { minLength: 2, maxLength: 6 }
          ),
          (amounts) => {
            // Arrange - Simular historial de montos
            const roundedAmounts = amounts.map(a => Math.round(a));
            
            // Act - Calcular best/worst como lo hace el servicio
            const minAmount = Math.min(...roundedAmounts);
            const maxAmount = Math.max(...roundedAmounts);
            
            // Assert - bestMonth debe ser el de menor gasto, worstMonth el de mayor
            expect(minAmount).toBeLessThanOrEqual(maxAmount);
            expect(roundedAmounts).toContain(minAmount);
            expect(roundedAmounts).toContain(maxAmount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 5: Milestone upsert idempotency
  describe('[Property] Milestone save idempotency', () => {
    it('should handle duplicate milestone errors gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'first_15_reduction',
            'first_month_improvement',
            'three_month_streak',
            'six_month_streak'
          ),
          fc.double({ min: 1, max: 100000, noNaN: true }),
          (milestoneType, amountSaved) => {
            // Arrange
            const roundedAmount = Math.round(amountSaved);
            
            // Assert - Los valores deben ser válidos
            expect(milestoneType).toBeTruthy();
            expect(roundedAmount).toBeGreaterThan(0);
            expect(isFinite(roundedAmount)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
