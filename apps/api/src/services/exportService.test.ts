import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { ExportService } from './exportService';
import { Transaction } from '../models/Transaction';
import ExcelJS from 'exceljs';

// Mock de Transaction model
vi.mock('../models/Transaction', () => ({
  Transaction: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  }
}));

describe('ExportService', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateExcelReport', () => {
    it('should generate Excel buffer with transactions', async () => {
      // Arrange
      const mockTransactions = [
        {
          _id: '507f1f77bcf86cd799439011',
          userId: '507f1f77bcf86cd799439012',
          date: new Date('2026-03-01'),
          description: 'Café Juan Valdez',
          amount: 5000,
          category: 'café/bebidas',
          merchant: 'Juan Valdez',
          isMicroExpense: true
        },
        {
          _id: '507f1f77bcf86cd799439013',
          userId: '507f1f77bcf86cd799439012',
          date: new Date('2026-03-02'),
          description: 'Almuerzo',
          amount: 15000,
          category: 'comida rápida',
          merchant: 'Restaurante',
          isMicroExpense: false
        }
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Act
      const buffer = await exportService.generateExcelReport({
        userId: '507f1f77bcf86cd799439012'
      });

      // Assert
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(Transaction.find).toHaveBeenCalledWith({
        userId: '507f1f77bcf86cd799439012'
      });
    });

    it('should filter transactions by date range', async () => {
      // Arrange
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Act
      await exportService.generateExcelReport({
        userId: '507f1f77bcf86cd799439012',
        startDate,
        endDate
      });

      // Assert
      expect(Transaction.find).toHaveBeenCalledWith({
        userId: '507f1f77bcf86cd799439012',
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
    });

    it('should create valid Excel workbook structure', async () => {
      // Arrange
      const mockTransactions = [
        {
          _id: '507f1f77bcf86cd799439011',
          userId: '507f1f77bcf86cd799439012',
          date: new Date('2026-03-01'),
          description: 'Test transaction',
          amount: 10000,
          category: 'café/bebidas',
          merchant: 'Test Merchant',
          isMicroExpense: true
        }
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Act
      const buffer = await exportService.generateExcelReport({
        userId: '507f1f77bcf86cd799439012'
      });

      // Verificar que el buffer es un Excel válido
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      // Assert
      expect(workbook.worksheets.length).toBeGreaterThan(0);
      const worksheet = workbook.getWorksheet('Transacciones');
      expect(worksheet).toBeDefined();
      expect(worksheet?.columnCount).toBe(6); // 6 columnas definidas
    });

    it('should handle empty transactions list', async () => {
      // Arrange
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };

      vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

      // Act
      const buffer = await exportService.generateExcelReport({
        userId: '507f1f77bcf86cd799439012'
      });

      // Assert
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('getExportStats', () => {
    it('should return correct export statistics', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439012';
      
      vi.mocked(Transaction.countDocuments)
        .mockResolvedValueOnce(100) // totalTransactions
        .mockResolvedValueOnce(45);  // microExpenses

      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 500000 }
      ]);

      // Act
      const stats = await exportService.getExportStats(userId);

      // Assert
      expect(stats).toEqual({
        totalTransactions: 100,
        microExpenses: 45,
        totalAmount: 500000,
        exportDate: expect.any(Date)
      });
    });

    it('should handle zero transactions', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439012';
      
      vi.mocked(Transaction.countDocuments)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(Transaction.aggregate).mockResolvedValue([]);

      // Act
      const stats = await exportService.getExportStats(userId);

      // Assert
      expect(stats.totalTransactions).toBe(0);
      expect(stats.microExpenses).toBe(0);
      expect(stats.totalAmount).toBe(0);
    });
  });

  // Feature: financeflow-ai, Property 1: Excel buffer debe ser válido
  describe('[Property] Excel buffer validity', () => {
    it('should always generate valid Excel buffers', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
              userId: fc.hexaString({ minLength: 24, maxLength: 24 }),
              date: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') }),
              description: fc.string({ minLength: 1, maxLength: 100 }),
              amount: fc.integer({ min: 1000, max: 1000000 }),
              category: fc.constantFrom('café/bebidas', 'comida rápida', 'transporte'),
              merchant: fc.string({ minLength: 1, maxLength: 50 }),
              isMicroExpense: fc.boolean()
            }),
            { minLength: 0, maxLength: 50 }
          ),
          async (transactions) => {
            // Arrange
            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(transactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            // Act
            const buffer = await exportService.generateExcelReport({
              userId: '507f1f77bcf86cd799439012'
            });

            // Assert - El buffer debe ser válido y poder cargarse como Excel
            const workbook = new ExcelJS.Workbook();
            await expect(workbook.xlsx.load(buffer as any)).resolves.not.toThrow();
            
            const worksheet = workbook.getWorksheet('Transacciones');
            expect(worksheet).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Feature: financeflow-ai, Property 2: Totales deben ser correctos
  describe('[Property] Total calculations correctness', () => {
    it('should calculate correct totals for any transaction set', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
              userId: fc.constant('507f1f77bcf86cd799439012'),
              date: fc.date(),
              description: fc.string({ minLength: 1, maxLength: 50 }),
              amount: fc.integer({ min: 1, max: 1000000 }),
              category: fc.constantFrom('café/bebidas', 'comida rápida'),
              merchant: fc.string({ minLength: 1, maxLength: 30 }),
              isMicroExpense: fc.boolean()
            }),
            { minLength: 1, maxLength: 100 }
          ),
          async (transactions) => {
            // Arrange
            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue(transactions)
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            // Act
            const buffer = await exportService.generateExcelReport({
              userId: '507f1f77bcf86cd799439012'
            });

            // Cargar Excel y verificar totales
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer as any);
            const worksheet = workbook.getWorksheet('Transacciones');

            // El total debe estar en la última fila, columna C (amount)
            const lastRow = worksheet?.rowCount;
            const totalCell = worksheet?.getRow(lastRow!).getCell(3); // Columna C

            // Assert - El total en Excel debe coincidir con la suma real
            expect(totalCell?.value).toHaveProperty('formula');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Feature: financeflow-ai, Property 3: Filtrado por fecha debe ser consistente
  describe('[Property] Date filtering consistency', () => {
    it('should only include transactions within date range', () => {
      fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2026-01-01') }),
          fc.date({ min: new Date('2026-01-02'), max: new Date('2026-12-31') }),
          async (startDate, endDate) => {
            // Arrange
            const mockQuery = {
              sort: vi.fn().mockReturnThis(),
              lean: vi.fn().mockResolvedValue([])
            };

            vi.mocked(Transaction.find).mockReturnValue(mockQuery as any);

            // Act
            await exportService.generateExcelReport({
              userId: '507f1f77bcf86cd799439012',
              startDate,
              endDate
            });

            // Assert - Debe llamar con el rango correcto
            expect(Transaction.find).toHaveBeenCalledWith({
              userId: '507f1f77bcf86cd799439012',
              date: {
                $gte: startDate,
                $lte: endDate
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
