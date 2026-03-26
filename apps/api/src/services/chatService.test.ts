import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processChatMessage, validateChatConfig } from './chatService';
import { Transaction } from '../models/Transaction';
import { savingsPlanService } from './savingsPlanService';
import OpenAI from 'openai';

// Mock de OpenAI
vi.mock('openai');

// Mock de Transaction model
vi.mock('../models/Transaction', () => ({
  Transaction: {
    find: vi.fn()
  }
}));

// Mock de savingsPlanService
vi.mock('./savingsPlanService', () => ({
  savingsPlanService: {
    getPlansForAI: vi.fn()
  }
}));

describe('chatService', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockUserMessage = '¿En qué categoría gasto más?';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de process.env
    process.env.OPENROUTER_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateChatConfig', () => {
    it('should return true when OPENROUTER_API_KEY is configured', () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      expect(validateChatConfig()).toBe(true);
    });

    it('should return false when OPENROUTER_API_KEY is not configured', () => {
      delete process.env.OPENROUTER_API_KEY;
      expect(validateChatConfig()).toBe(false);
    });
  });

  describe('processChatMessage', () => {
    describe('Test de Resiliencia - Sin transacciones', () => {
      it('should handle empty transactions array gracefully', async () => {
        // Arrange: Mock de Transaction.find que devuelve array vacío
        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([])
        });
        (Transaction.find as any) = mockFind;

        // Act
        const result = await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        expect(result).toEqual({
          message: '⚠️ No encontré transacciones en los últimos 30 días. Asegúrate de haber importado tus datos bancarios para que pueda ayudarte con el análisis.',
          transactionsAnalyzed: 0,
          periodAnalyzed: '30 días'
        });
        expect(mockFind).toHaveBeenCalled();
      });

      it('should not call OpenRouter API when there are no transactions', async () => {
        // Arrange
        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([])
        });
        (Transaction.find as any) = mockFind;

        const mockCreate = vi.fn();
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        expect(mockCreate).not.toHaveBeenCalled();
      });
    });

    describe('Test de Mano Dura - Sobregiro detectado', () => {
      it('should generate overspend context when spending exceeds savings plan target', async () => {
        // Arrange: Transacciones que suman 269.900 COP en categoría "café/bebidas"
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Juan Valdez',
            amount: 89900,
            category: 'café/bebidas',
            merchant: 'Juan Valdez',
            isMicroExpense: true
          },
          {
            _id: '2',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Starbucks',
            amount: 90000,
            category: 'café/bebidas',
            merchant: 'Starbucks',
            isMicroExpense: true
          },
          {
            _id: '3',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Juan Valdez',
            amount: 90000,
            category: 'café/bebidas',
            merchant: 'Juan Valdez',
            isMicroExpense: true
          }
        ];

        // Mock de Transaction.find para transacciones de los últimos 30 días
        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        // Mock de savingsPlanService.getPlansForAI
        const mockPlan = {
          category: 'café/bebidas',
          targetAmount: 200000,
          currentAmount: 150000, // Este valor será recalculado
          progressPercentage: 75,
          statusColor: 'green' as const,
          daysRemaining: 15
        };
        (savingsPlanService.getPlansForAI as any).mockResolvedValue([mockPlan]);

        // Mock de OpenAI response
        const mockAIResponse = {
          choices: [{
            message: {
              content: 'Veo que quieres limitarte a 200.000 COP en café/bebidas, pero este mes ya llevas 269.900 COP. Estás en sobregiro por 69.900 COP.'
            }
          }]
        };

        const mockCreate = vi.fn().mockResolvedValue(mockAIResponse);
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        const result = await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        expect(result.transactionsAnalyzed).toBe(3);
        expect(result.periodAnalyzed).toBe('30 días');
        expect(mockCreate).toHaveBeenCalled();

        // Verificar que el contexto enviado a la IA incluye información de sobregiro
        const callArgs = mockCreate.mock.calls[0][0];
        const userMessage = callArgs.messages.find((m: any) => m.role === 'user')?.content || '';
        
        // Verificar que el contexto menciona el sobregiro
        expect(userMessage).toContain('SOBREGIRO');
        expect(userMessage).toContain('café/bebidas');
        expect(userMessage).toContain('200.000 COP'); // Meta
        expect(userMessage).toContain('269.900 COP'); // Gasto real
      });

      it('should include "TONO DIRECTO" instructions for red status plans', async () => {
        // Arrange
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Rappi',
            amount: 250000,
            category: 'comida rápida',
            merchant: 'Rappi',
            isMicroExpense: false
          }
        ];

        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        const mockPlan = {
          category: 'comida rápida',
          targetAmount: 200000,
          currentAmount: 250000,
          progressPercentage: 125,
          statusColor: 'red' as const,
          daysRemaining: 10
        };
        (savingsPlanService.getPlansForAI as any).mockResolvedValue([mockPlan]);

        const mockCreate = vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        });
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        const callArgs = mockCreate.mock.calls[0][0];
        const userMessage = callArgs.messages.find((m: any) => m.role === 'user')?.content || '';
        
        expect(userMessage).toContain('TONO DIRECTO');
        expect(userMessage).toContain('NO SUGIERAS FLEXIBILIDAD');
        expect(userMessage).toContain('ENFOQUE EN DISCIPLINA');
        expect(userMessage).toContain('estás en sobregiro');
      });
    });

    describe('Test de Contexto Financiero', () => {
      it('should include transaction summary in context', async () => {
        // Arrange
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Uber',
            amount: 15000,
            category: 'transporte',
            merchant: 'Uber',
            isMicroExpense: true
          },
          {
            _id: '2',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Juan Valdez',
            amount: 8500,
            category: 'café/bebidas',
            merchant: 'Juan Valdez',
            isMicroExpense: true
          }
        ];

        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        (savingsPlanService.getPlansForAI as any).mockResolvedValue([]);

        const mockCreate = vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        });
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        const callArgs = mockCreate.mock.calls[0][0];
        const userMessage = callArgs.messages.find((m: any) => m.role === 'user')?.content || '';
        
        expect(userMessage).toContain('CONTEXTO FINANCIERO DEL USUARIO');
        expect(userMessage).toContain('23.500 COP'); // Total
        expect(userMessage).toContain('transporte');
        expect(userMessage).toContain('café/bebidas');
        expect(userMessage).toContain('Uber');
        expect(userMessage).toContain('Juan Valdez');
      });

      it('should include conversation history in API call', async () => {
        // Arrange
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Test',
            amount: 10000,
            category: 'test',
            merchant: 'Test',
            isMicroExpense: true
          }
        ];

        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        (savingsPlanService.getPlansForAI as any).mockResolvedValue([]);

        const mockCreate = vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        });
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        const conversationHistory = [
          { role: 'user' as const, content: 'Pregunta anterior' },
          { role: 'assistant' as const, content: 'Respuesta anterior' }
        ];

        // Act
        await processChatMessage(mockUserId, mockUserMessage, conversationHistory);

        // Assert
        const callArgs = mockCreate.mock.calls[0][0];
        expect(callArgs.messages).toHaveLength(4); // system + 2 history + user
        expect(callArgs.messages[1].content).toBe('Pregunta anterior');
        expect(callArgs.messages[2].content).toBe('Respuesta anterior');
      });
    });

    describe('Test de Manejo de Errores', () => {
      it('should return fallback message when OpenRouter API fails', async () => {
        // Arrange
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Test',
            amount: 10000,
            category: 'test',
            merchant: 'Test',
            isMicroExpense: true
          }
        ];

        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        (savingsPlanService.getPlansForAI as any).mockResolvedValue([]);

        // Mock de OpenAI que falla
        const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        const result = await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        expect(result).toEqual({
          message: '⚠️ Lo siento, tuve un problema al analizar tus datos. Por favor intenta de nuevo en unos momentos.',
          transactionsAnalyzed: 0,
          periodAnalyzed: '30 días'
        });
      });

      it('should throw error when OPENROUTER_API_KEY is not configured', async () => {
        // Arrange
        delete process.env.OPENROUTER_API_KEY;

        // Act & Assert
        const result = await processChatMessage(mockUserId, mockUserMessage);
        
        expect(result).toEqual({
          message: '⚠️ Lo siento, tuve un problema al analizar tus datos. Por favor intenta de nuevo en unos momentos.',
          transactionsAnalyzed: 0,
          periodAnalyzed: '30 días'
        });
      });

      it('should continue without plans context if savingsPlanService fails', async () => {
        // Arrange
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Test',
            amount: 10000,
            category: 'test',
            merchant: 'Test',
            isMicroExpense: true
          }
        ];

        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        // Mock de savingsPlanService que falla
        (savingsPlanService.getPlansForAI as any).mockRejectedValue(new Error('DB Error'));

        const mockCreate = vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        });
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        const result = await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        expect(result.message).toBe('Test response');
        expect(result.transactionsAnalyzed).toBe(1);
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    describe('Test de Formato de Moneda', () => {
      it('should format amounts with Colombian locale (thousands separator)', async () => {
        // Arrange
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Test',
            amount: 1234567,
            category: 'test',
            merchant: 'Test',
            isMicroExpense: false
          }
        ];

        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        (savingsPlanService.getPlansForAI as any).mockResolvedValue([]);

        const mockCreate = vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        });
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        const callArgs = mockCreate.mock.calls[0][0];
        const userMessage = callArgs.messages.find((m: any) => m.role === 'user')?.content || '';
        
        // Verificar formato colombiano con separador de miles
        expect(userMessage).toContain('1.234.567 COP');
      });
    });

    describe('Test de Integración con Planes de Ahorro', () => {
      it('should include active savings plans in context', async () => {
        // Arrange
        const mockTransactions = [
          {
            _id: '1',
            userId: mockUserId,
            date: new Date().toISOString(),
            description: 'Test',
            amount: 10000,
            category: 'café/bebidas',
            merchant: 'Test',
            isMicroExpense: true
          }
        ];

        const mockFind = vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions)
        });
        (Transaction.find as any) = mockFind;

        const mockPlans = [
          {
            category: 'café/bebidas',
            targetAmount: 100000,
            currentAmount: 50000,
            progressPercentage: 50,
            statusColor: 'green' as const,
            daysRemaining: 20
          }
        ];
        (savingsPlanService.getPlansForAI as any).mockResolvedValue(mockPlans);

        const mockCreate = vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        });
        (OpenAI as any).mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }));

        // Act
        await processChatMessage(mockUserId, mockUserMessage);

        // Assert
        const callArgs = mockCreate.mock.calls[0][0];
        const userMessage = callArgs.messages.find((m: any) => m.role === 'user')?.content || '';
        
        expect(userMessage).toContain('PLANES DE AHORRO ACTIVOS');
        expect(userMessage).toContain('café/bebidas');
        expect(userMessage).toContain('100.000 COP');
        expect(userMessage).toContain('REGLA DE ORO');
      });
    });
  });
});
