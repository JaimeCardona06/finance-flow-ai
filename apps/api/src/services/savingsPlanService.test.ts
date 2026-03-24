import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import mongoose from 'mongoose';

// Mock functions creados con vi.hoisted() para evitar problemas de hoisting
const { mockFindOne, mockFind, mockDeleteOne, mockSave } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
  mockFind: vi.fn(),
  mockDeleteOne: vi.fn(),
  mockSave: vi.fn()
}));

// Mock de SavingsPlan model
vi.mock('../models/SavingsPlan', () => ({
  SavingsPlan: class MockSavingsPlan {
    _id: any;
    userId: any;
    category: string;
    targetAmount: number;
    currentAmount: number;
    startDate: Date;
    endDate: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: any) {
      Object.assign(this, data);
      this._id = data._id || new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      this.userId = data.userId;
      this.category = data.category;
      this.targetAmount = data.targetAmount;
      this.currentAmount = data.currentAmount || 0;
      this.startDate = data.startDate;
      this.endDate = data.endDate;
      this.status = data.status || 'active';
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
    }

    getProgressPercentage() {
      return Math.round((this.currentAmount / this.targetAmount) * 100);
    }

    updateStatus() {
      // Mock implementation
    }

    save = mockSave;

    toObject() {
      return {
        _id: this._id,
        userId: this.userId,
        category: this.category,
        targetAmount: this.targetAmount,
        currentAmount: this.currentAmount,
        startDate: this.startDate,
        endDate: this.endDate,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }

    static findOne = mockFindOne;
    static find = mockFind;
    static deleteOne = mockDeleteOne;
  }
}));

// Importar después del mock
import { savingsPlanService } from './savingsPlanService';
import { SavingsPlan } from '../models/SavingsPlan';

// ID de usuario válido de 24 caracteres para evitar BSONError
const VALID_USER_ID = '507f1f77bcf86cd799439011';
const VALID_PLAN_ID = '507f1f77bcf86cd799439012';

// Helper para crear un plan mock
function createMockPlan(overrides: any = {}) {
  const _id = overrides._id || new mongoose.Types.ObjectId(VALID_PLAN_ID);
  const userId = overrides.userId || new mongoose.Types.ObjectId(VALID_USER_ID);
  const category = overrides.category || 'transporte';
  const targetAmount = overrides.targetAmount || 100000;
  const currentAmount = overrides.currentAmount !== undefined ? overrides.currentAmount : 0;
  const startDate = overrides.startDate || new Date('2026-01-01');
  const endDate = overrides.endDate || new Date('2026-02-01');
  const status = overrides.status || 'active';
  const createdAt = overrides.createdAt || new Date('2026-01-01');
  const updatedAt = overrides.updatedAt || new Date('2026-01-01');

  const plan: any = {
    _id,
    userId,
    category,
    targetAmount,
    currentAmount,
    startDate,
    endDate,
    status,
    createdAt,
    updatedAt,
    updateStatus: vi.fn(),
    save: vi.fn().mockResolvedValue(true)
  };
  
  // getProgressPercentage como función regular que calcula el porcentaje real
  // Esto asegura que siempre retorne un valor válido basado en los montos actuales
  plan.getProgressPercentage = function() {
    if (this.targetAmount === 0) return 0;
    const percentage = Math.round((this.currentAmount / this.targetAmount) * 100);
    return isFinite(percentage) ? percentage : 0;
  };
  
  // toObject como función regular que SIEMPRE retorna un objeto válido
  plan.toObject = function() {
    return {
      _id: this._id,
      userId: this.userId,
      category: this.category,
      targetAmount: this.targetAmount,
      currentAmount: this.currentAmount,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return plan;
}

describe('savingsPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSave.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPlan', () => {
    it('should create a new savings plan successfully', async () => {
      // Arrange
      mockFindOne.mockResolvedValue(null);

      // Act
      const input = {
        userId: VALID_USER_ID,
        category: 'Transporte',
        targetAmount: 100000,
        durationMonths: 1
      };

      const result = await savingsPlanService.createPlan(input);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({
        userId: expect.any(mongoose.Types.ObjectId),
        category: 'transporte',
        status: 'active'
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if active plan already exists for category', async () => {
      // Arrange
      const existingPlan = createMockPlan({ category: 'transporte' });
      mockFindOne.mockResolvedValue(existingPlan as any);

      // Act & Assert
      await expect(savingsPlanService.createPlan({
        userId: VALID_USER_ID,
        category: 'Transporte',
        targetAmount: 100000,
        durationMonths: 1
      })).rejects.toThrow('Ya existe un plan activo para la categoría "Transporte"');
    });

    it('should normalize category to lowercase', async () => {
      // Arrange
      mockFindOne.mockResolvedValue(null);

      // Act
      await savingsPlanService.createPlan({
        userId: VALID_USER_ID,
        category: 'TRANSPORTE',
        targetAmount: 100000,
        durationMonths: 1
      });

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'transporte'
        })
      );
    });
  });

  describe('getActivePlans', () => {
    it('should return active plans with progress information', async () => {
      // Arrange
      const mockPlan = createMockPlan({
        currentAmount: 50000,
        targetAmount: 100000
      });

      const mockQuery = {
        sort: vi.fn().mockReturnThis()
      };
      mockQuery.sort.mockResolvedValue([mockPlan]);

      mockFind.mockReturnValue(mockQuery as any);

      // Act
      const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        category: 'transporte',
        targetAmount: 100000,
        currentAmount: 50000,
        progressPercentage: 50,
        statusColor: 'green'
      });
    });

    it('should set statusColor to yellow when progress >= 80%', async () => {
      // Arrange
      const mockPlan = createMockPlan({
        currentAmount: 85000,
        targetAmount: 100000
      });

      const mockQuery = {
        sort: vi.fn().mockReturnThis()
      };
      mockQuery.sort.mockResolvedValue([mockPlan]);

      mockFind.mockReturnValue(mockQuery as any);

      // Act
      const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

      // Assert
      expect(result[0].statusColor).toBe('yellow');
    });

    it('should set statusColor to red when progress >= 100%', async () => {
      // Arrange
      const mockPlan = createMockPlan({
        currentAmount: 105000,
        targetAmount: 100000
      });

      const mockQuery = {
        sort: vi.fn().mockReturnThis()
      };
      mockQuery.sort.mockResolvedValue([mockPlan]);

      mockFind.mockReturnValue(mockQuery as any);

      // Act
      const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

      // Assert
      expect(result[0].statusColor).toBe('red');
    });

    it('should calculate days remaining correctly', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const mockPlan = createMockPlan({
        endDate: futureDate
      });

      const mockQuery = {
        sort: vi.fn().mockReturnThis()
      };
      mockQuery.sort.mockResolvedValue([mockPlan]);

      mockFind.mockReturnValue(mockQuery as any);

      // Act
      const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

      // Assert
      expect(result[0].daysRemaining).toBeGreaterThanOrEqual(14);
      expect(result[0].daysRemaining).toBeLessThanOrEqual(16);
    });
  });

  describe('updatePlanAmount', () => {
    it('should update plan amount when active plan exists', async () => {
      // Arrange
      const mockPlan = createMockPlan({
        currentAmount: 50000
      });

      mockFindOne.mockResolvedValue(mockPlan as any);

      // Act
      await savingsPlanService.updatePlanAmount(VALID_USER_ID, 'transporte', 10000);

      // Assert
      expect(mockPlan.currentAmount).toBe(60000);
      expect(mockPlan.updateStatus).toHaveBeenCalled();
      expect(mockPlan.save).toHaveBeenCalled();
    });

    it('should do nothing when no active plan exists', async () => {
      // Arrange
      mockFindOne.mockResolvedValue(null);

      // Act
      await savingsPlanService.updatePlanAmount(VALID_USER_ID, 'transporte', 10000);

      // Assert - No debe lanzar error
      expect(mockFindOne).toHaveBeenCalled();
    });

    it('should normalize category to lowercase', async () => {
      // Arrange
      const mockPlan = createMockPlan();
      mockFindOne.mockResolvedValue(mockPlan as any);

      // Act
      await savingsPlanService.updatePlanAmount(VALID_USER_ID, 'TRANSPORTE', 10000);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'transporte'
        })
      );
    });
  });

  describe('checkAndUpdatePlanStatuses', () => {
    it('should update status of all active plans', async () => {
      // Arrange
      const mockPlan1 = createMockPlan({ category: 'transporte' });
      const mockPlan2 = createMockPlan({ category: 'comida' });

      mockFind.mockResolvedValue([mockPlan1, mockPlan2] as any);

      // Act
      await savingsPlanService.checkAndUpdatePlanStatuses(VALID_USER_ID);

      // Assert
      expect(mockPlan1.updateStatus).toHaveBeenCalled();
      expect(mockPlan1.save).toHaveBeenCalled();
      expect(mockPlan2.updateStatus).toHaveBeenCalled();
      expect(mockPlan2.save).toHaveBeenCalled();
    });

    it('should handle empty plans array', async () => {
      // Arrange
      mockFind.mockResolvedValue([] as any);

      // Act & Assert - No debe lanzar error
      await savingsPlanService.checkAndUpdatePlanStatuses(VALID_USER_ID);
    });
  });

  describe('deletePlan', () => {
    it('should delete plan successfully', async () => {
      // Arrange
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 } as any);

      // Act
      const result = await savingsPlanService.deletePlan(VALID_PLAN_ID, VALID_USER_ID);

      // Assert
      expect(result).toBe(true);
      expect(mockDeleteOne).toHaveBeenCalledWith({
        _id: expect.any(mongoose.Types.ObjectId),
        userId: expect.any(mongoose.Types.ObjectId)
      });
    });

    it('should return false when plan not found', async () => {
      // Arrange
      mockDeleteOne.mockResolvedValue({ deletedCount: 0 } as any);

      // Act
      const result = await savingsPlanService.deletePlan(VALID_PLAN_ID, VALID_USER_ID);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getPlansForAI', () => {
    it('should return simplified plan data for AI', async () => {
      // Arrange
      const mockPlan = createMockPlan({
        currentAmount: 50000,
        targetAmount: 100000
      });

      const mockQuery = {
        sort: vi.fn().mockReturnThis()
      };
      mockQuery.sort.mockResolvedValue([mockPlan]);

      mockFind.mockReturnValue(mockQuery as any);

      // Act
      const result = await savingsPlanService.getPlansForAI(VALID_USER_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        category: 'transporte',
        targetAmount: 100000,
        currentAmount: 50000,
        progressPercentage: 50,
        statusColor: 'green',
        daysRemaining: expect.any(Number)
      });
    });
  });

  // Feature: financeflow-ai, Property 1: Cálculos financieros nunca deben retornar NaN o Infinity
  describe('[Property] Financial calculations robustness', () => {
    it('should never return NaN or Infinity for any valid amounts', () => {
      fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0.01, max: 1000000000, noNaN: true }),
          fc.double({ min: 0, max: 1000000000, noNaN: true }),
          async (targetAmount, currentAmount) => {
            // Arrange
            const mockPlan = createMockPlan({
              targetAmount: Math.round(targetAmount),
              currentAmount: Math.round(currentAmount)
            });

            const mockQuery = {
              sort: vi.fn().mockReturnThis()
            };
            mockQuery.sort.mockResolvedValue([mockPlan]);

            mockFind.mockReturnValue(mockQuery as any);

            // Act
            const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

            // Assert - Nunca debe retornar NaN o Infinity
            expect(result).toHaveLength(1);
            expect(isNaN(result[0].progressPercentage)).toBe(false);
            expect(isFinite(result[0].progressPercentage)).toBe(true);
            expect(isNaN(result[0].targetAmount)).toBe(false);
            expect(isFinite(result[0].targetAmount)).toBe(true);
            expect(isNaN(result[0].currentAmount)).toBe(false);
            expect(isFinite(result[0].currentAmount)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle very small amounts without precision errors', () => {
      fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0.01, max: 1, noNaN: true }),
          fc.double({ min: 0, max: 1, noNaN: true }),
          async (targetAmount, currentAmount) => {
            // Arrange
            const mockPlan = createMockPlan({
              targetAmount,
              currentAmount
            });

            const mockQuery = {
              sort: vi.fn().mockReturnThis()
            };
            mockQuery.sort.mockResolvedValue([mockPlan]);

            mockFind.mockReturnValue(mockQuery as any);

            // Act
            const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

            // Assert
            expect(result[0].progressPercentage).toBeGreaterThanOrEqual(0);
            expect(result[0].progressPercentage).toBeLessThanOrEqual(100000); // Puede superar 100%
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle very large amounts without overflow', () => {
      fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1000000, max: Number.MAX_SAFE_INTEGER / 2, noNaN: true }),
          fc.double({ min: 0, max: Number.MAX_SAFE_INTEGER / 2, noNaN: true }),
          async (targetAmount, currentAmount) => {
            // Arrange
            const mockPlan = createMockPlan({
              targetAmount: Math.round(targetAmount),
              currentAmount: Math.round(currentAmount)
            });

            const mockQuery = {
              sort: vi.fn().mockReturnThis()
            };
            mockQuery.sort.mockResolvedValue([mockPlan]);

            mockFind.mockReturnValue(mockQuery as any);

            // Act
            const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

            // Assert
            expect(isFinite(result[0].targetAmount)).toBe(true);
            expect(isFinite(result[0].currentAmount)).toBe(true);
            expect(result[0].targetAmount).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: financeflow-ai, Property 2: Lógica de colores de estado
  describe('[Property] Status color logic', () => {
    it('should always assign correct color based on progress percentage', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 200 }),
          async (progressPercentage) => {
            // Arrange - Calcular targetAmount y currentAmount para obtener el progressPercentage deseado
            const targetAmount = 100;
            const currentAmount = Math.round((progressPercentage / 100) * targetAmount);
            
            const mockPlan = createMockPlan({
              targetAmount,
              currentAmount
            });

            const mockQuery = {
              sort: vi.fn().mockReturnThis()
            };
            mockQuery.sort.mockResolvedValue([mockPlan]);

            mockFind.mockReturnValue(mockQuery as any);

            // Act
            const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

            // Assert - Verificar lógica de colores
            const actualProgress = result[0].progressPercentage;
            if (actualProgress >= 100) {
              expect(result[0].statusColor).toBe('red');
            } else if (actualProgress >= 80) {
              expect(result[0].statusColor).toBe('yellow');
            } else {
              expect(result[0].statusColor).toBe('green');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 3: Actualización de montos
  describe('[Property] Amount update correctness', () => {
    it('should correctly accumulate amounts', () => {
      fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0, max: 100000, noNaN: true }),
          fc.array(
            fc.double({ min: 1, max: 10000, noNaN: true }),
            { minLength: 1, maxLength: 10 }
          ),
          async (initialAmount, increments) => {
            // Arrange
            let currentAmount = Math.round(initialAmount);
            
            // Act - Aplicar todos los incrementos
            for (const increment of increments) {
              // Crear un nuevo mock para cada iteración para evitar problemas de estado compartido
              const mockPlan = createMockPlan({
                currentAmount
              });
              
              mockFindOne.mockResolvedValue(mockPlan as any);
              
              const roundedIncrement = Math.round(increment);
              await savingsPlanService.updatePlanAmount(VALID_USER_ID, 'transporte', roundedIncrement);
              currentAmount = mockPlan.currentAmount; // Actualizar con el valor del mock
            }

            // Assert - El monto final debe ser la suma de todos los incrementos
            const expectedTotal = Math.round(initialAmount) + 
              increments.reduce((sum, inc) => sum + Math.round(inc), 0);
            
            expect(currentAmount).toBe(expectedTotal);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: financeflow-ai, Property 4: Días restantes siempre positivos o cero
  describe('[Property] Days remaining calculation', () => {
    it('should calculate days remaining correctly for any future date', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 365 }),
          async (daysInFuture) => {
            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);

            const mockPlan = createMockPlan({
              endDate: futureDate
            });

            const mockQuery = {
              sort: vi.fn().mockReturnThis()
            };
            mockQuery.sort.mockResolvedValue([mockPlan]);

            mockFind.mockReturnValue(mockQuery as any);

            // Act
            const result = await savingsPlanService.getActivePlans(VALID_USER_ID);

            // Assert - Días restantes debe estar cerca del valor esperado
            expect(result[0].daysRemaining).toBeGreaterThanOrEqual(daysInFuture - 1);
            expect(result[0].daysRemaining).toBeLessThanOrEqual(daysInFuture + 1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: financeflow-ai, Property 5: Robustez ante errores
  describe('[Property] Error handling robustness', () => {
    it('should never throw unhandled exceptions', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            targetAmount: fc.double({ min: 1, max: 1000000, noNaN: true }),
            currentAmount: fc.double({ min: 0, max: 1000000, noNaN: true }),
            daysInFuture: fc.integer({ min: -100, max: 365 })
          }),
          async (planData) => {
            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + planData.daysInFuture);

            const mockPlan = createMockPlan({
              targetAmount: Math.round(planData.targetAmount),
              currentAmount: Math.round(planData.currentAmount),
              endDate: futureDate
            });

            const mockQuery = {
              sort: vi.fn().mockReturnThis()
            };
            mockQuery.sort.mockResolvedValue([mockPlan]);

            mockFind.mockReturnValue(mockQuery as any);

            // Act & Assert - No debe lanzar excepciones
            const result = await savingsPlanService.getActivePlans(VALID_USER_ID);
            expect(Array.isArray(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
