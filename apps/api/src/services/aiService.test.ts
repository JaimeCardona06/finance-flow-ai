import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { generateNarrative, extractTransactionsFromText, validateGeminiConfig } from './aiService';

// Mock de OpenAI - Crear el mock fuera del factory para que sea accesible
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

// Mock de savingsPlanService - Usar vi.hoisted para evitar problemas de hoisting
const mockGetPlansForAI = vi.hoisted(() => vi.fn());

vi.mock('./savingsPlanService', () => ({
  savingsPlanService: {
    getPlansForAI: mockGetPlansForAI
  }
}));

describe('aiService', () => {
  beforeEach(() => {
    // Configurar API key en env
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    vi.clearAllMocks();
    
    // Configurar mock de savingsPlanService por defecto
    mockGetPlansForAI.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateGeminiConfig', () => {
    it('should return true when API key is configured', () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      expect(validateGeminiConfig()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      delete process.env.OPENROUTER_API_KEY;
      expect(validateGeminiConfig()).toBe(false);
    });
  });

  describe('generateNarrative', () => {
    const mockTransactions = [
      {
        description: 'Café Juan Valdez',
        amount: 5000,
        date: '2026-03-01',
        category: 'café/bebidas'
      },
      {
        description: 'Almuerzo',
        amount: 15000,
        date: '2026-03-02',
        category: 'comida rápida'
      },
      {
        description: 'Uber',
        amount: 12000,
        date: '2026-03-03',
        category: 'transporte'
      }
    ];

    it('should generate narrative successfully with valid transactions', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: '**Análisis del Comportamiento Actual:**\n\nHas destinado **32,000 COP** en gastos hormiga...'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      const narrative = await generateNarrative(mockTransactions, 'user123');

      // Assert
      expect(narrative).toBeTruthy();
      expect(narrative).toContain('Análisis');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'google/gemini-2.5-flash',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('32.000 COP') // Formato español
            })
          ])
        })
      );
    });

    it('should return fallback message when transactions array is empty', async () => {
      // Act
      const narrative = await generateNarrative([], 'user123');

      // Assert
      expect(narrative).toBe('No hay transacciones para analizar. Importa tus datos bancarios para comenzar.');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should return fallback when API key is not configured', async () => {
      // Arrange
      delete process.env.OPENROUTER_API_KEY;

      // Act
      const narrative = await generateNarrative(mockTransactions, 'user123');

      // Assert
      expect(narrative).toContain('⚠️ **Análisis básico (sin IA)**');
      expect(narrative).toContain('32.000 COP');
    });

    it('should return fallback narrative when API call fails', async () => {
      // Arrange
      mockCreate.mockRejectedValue(new Error('API Error'));

      // Act
      const narrative = await generateNarrative(mockTransactions, 'user123');

      // Assert
      expect(narrative).toContain('⚠️ **Análisis básico (sin IA)**');
      expect(narrative).toContain('32.000 COP'); // Spanish formatting uses . for thousands
      expect(narrative).toContain('Café Juan Valdez');
    });

    it('should include comparison data in prompt when provided', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'Narrativa con comparación histórica'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const comparisonData = {
        currentMonth: { totalAmount: 100000, month: '2026-03' },
        previousMonth: { totalAmount: 120000, month: '2026-02' },
        delta: { amount: -20000, percentage: -16.7, trend: 'down' as const },
        improvement: true
      };

      // Act
      await generateNarrative(mockTransactions, 'user123', comparisonData);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('CONTEXTO HISTÓRICO')
            })
          ])
        })
      );
    });

    it('should handle API response with empty content', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: ''
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      const narrative = await generateNarrative(mockTransactions, 'user123');

      // Assert - Empty content returns empty string (trimmed)
      expect(narrative).toBe('');
    });

    it('should handle API response with no choices', async () => {
      // Arrange
      const mockResponse = {
        choices: []
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      const narrative = await generateNarrative(mockTransactions, 'user123');

      // Assert - No choices returns empty string
      expect(narrative).toBe('');
    });

    it('should calculate statistics correctly', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'Narrativa generada'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      await generateNarrative(mockTransactions, 'user123');

      // Assert
      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('32.000 COP'); // Total (formato español)
      expect(prompt).toContain('10.667 COP'); // Promedio (formato español)
      expect(prompt).toContain('3'); // Número de transacciones
    });
  });

  describe('extractTransactionsFromText', () => {
    it('should extract transactions from natural language successfully', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                description: 'Almuerzo',
                amount: 15000,
                date: '2026-03-24',
                category: 'comida rápida'
              },
              {
                description: 'Gasolina',
                amount: 50000,
                date: '2026-03-24',
                category: 'transporte'
              }
            ])
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      const transactions = await extractTransactionsFromText('15k en almuerzo y 50 lucas de gasolina');

      // Assert
      expect(transactions).toHaveLength(2);
      expect(transactions[0]).toEqual({
        description: 'Almuerzo',
        amount: 15000,
        date: '2026-03-24',
        category: 'comida rápida'
      });
      expect(transactions[1]).toEqual({
        description: 'Gasolina',
        amount: 50000,
        date: '2026-03-24',
        category: 'transporte'
      });
    });

    it('should throw error when API key is not configured', async () => {
      // Arrange
      delete process.env.OPENROUTER_API_KEY;

      // Act & Assert
      await expect(extractTransactionsFromText('15k en almuerzo'))
        .rejects.toThrow('OPENROUTER_API_KEY no está configurada');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      mockCreate.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(extractTransactionsFromText('15k en almuerzo'))
        .rejects.toThrow('Network error');
    });

    it('should clean markdown from response', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: '```json\n[{"description":"Café","amount":5000,"date":"2026-03-24","category":"café/bebidas"}]\n```'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      const transactions = await extractTransactionsFromText('5k en café');

      // Assert
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe('Café');
    });

    it('should filter out invalid transactions', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                description: 'Válido',
                amount: 10000,
                date: '2026-03-24',
                category: 'comida rápida'
              },
              {
                description: '', // Inválido: sin descripción
                amount: 5000,
                date: '2026-03-24'
              },
              {
                description: 'Inválido',
                amount: -1000, // Inválido: monto negativo
                date: '2026-03-24'
              },
              {
                description: 'Inválido',
                amount: 0, // Inválido: monto cero
                date: '2026-03-24'
              }
            ])
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      const transactions = await extractTransactionsFromText('texto de prueba');

      // Assert
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe('Válido');
    });

    it('should throw error when response is not an array', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ error: 'Not an array' })
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(extractTransactionsFromText('texto'))
        .rejects.toThrow('La respuesta no es un array válido');
    });

    it('should handle empty response from API', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: '[]'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act
      const transactions = await extractTransactionsFromText('texto sin gastos');

      // Assert
      expect(transactions).toHaveLength(0);
    });

    it('should handle malformed JSON response', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'not valid json'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(extractTransactionsFromText('texto'))
        .rejects.toThrow();
    });
  });

  // Feature: financeflow-ai, Property 1: generateNarrative nunca debe lanzar excepciones no controladas
  describe('[Property] generateNarrative error handling', () => {
    it('should never throw unhandled exceptions with random transaction data', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              description: fc.string({ minLength: 1, maxLength: 100 }),
              amount: fc.integer({ min: 1, max: 10000000 }),
              date: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
                .map(d => d.toISOString().split('T')[0]),
              category: fc.constantFrom(
                'café/bebidas',
                'comida rápida',
                'transporte',
                'suscripciones',
                'entretenimiento',
                'misceláneos',
                undefined
              )
            }),
            { minLength: 0, maxLength: 100 }
          ),
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          async (transactions, userId) => {
            // Arrange
            const mockResponse = {
              choices: [{
                message: {
                  content: 'Narrativa generada por IA'
                }
              }]
            };

            mockCreate.mockResolvedValue(mockResponse);

            // Act & Assert - No debe lanzar excepciones
            const result = await generateNarrative(transactions, userId);
            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle API failures gracefully with any transaction data', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              description: fc.string({ minLength: 1, maxLength: 50 }),
              amount: fc.integer({ min: 1, max: 1000000 }),
              date: fc.string(),
              category: fc.option(fc.string(), { nil: undefined })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (transactions) => {
            // Arrange - Simular fallo de API
            mockCreate.mockRejectedValue(new Error('API Error'));

            // Act
            const result = await generateNarrative(transactions, 'test-user');

            // Assert - Debe retornar fallback, no lanzar excepción
            expect(result).toContain('⚠️ **Análisis básico (sin IA)**');
            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Feature: financeflow-ai, Property 2: extractTransactionsFromText debe manejar cualquier string
  describe('[Property] extractTransactionsFromText robustness', () => {
    it('should handle any random string input without crashing', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 500 }),
          async (randomText) => {
            // Arrange - Simular respuesta válida de API
            const mockResponse = {
              choices: [{
                message: {
                  content: JSON.stringify([])
                }
              }]
            };

            mockCreate.mockResolvedValue(mockResponse);

            // Act & Assert - No debe lanzar excepciones
            const result = await extractTransactionsFromText(randomText);
            expect(Array.isArray(result)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle garbage API responses without crashing', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.oneof(
            fc.constant('not json'),
            fc.constant('{"invalid": "structure"}'),
            fc.constant('[{"missing": "fields"}]'),
            fc.constant(''),
            fc.constant('null'),
            fc.constant('undefined')
          ),
          async (inputText, garbageResponse) => {
            // Arrange
            const mockResponse = {
              choices: [{
                message: {
                  content: garbageResponse
                }
              }]
            };

            mockCreate.mockResolvedValue(mockResponse);

            // Act & Assert - Debe lanzar error controlado o retornar array vacío
            try {
              const result = await extractTransactionsFromText(inputText);
              // Si no lanza error, debe ser un array
              expect(Array.isArray(result)).toBe(true);
            } catch (error) {
              // Si lanza error, debe ser un Error conocido
              expect(error).toBeInstanceOf(Error);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Feature: financeflow-ai, Property 3: Validación de estructura de transacciones extraídas
  describe('[Property] Transaction structure validation', () => {
    it('should always return valid transaction structure when API succeeds', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              description: fc.string({ minLength: 1, maxLength: 50 }),
              amount: fc.integer({ min: 1, max: 1000000 }),
              date: fc.date().map(d => d.toISOString().split('T')[0]),
              category: fc.constantFrom(
                'café/bebidas',
                'comida rápida',
                'transporte',
                'suscripciones',
                'entretenimiento',
                'misceláneos'
              )
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (validTransactions) => {
            // Arrange
            const mockResponse = {
              choices: [{
                message: {
                  content: JSON.stringify(validTransactions)
                }
              }]
            };

            mockCreate.mockResolvedValue(mockResponse);

            // Act
            const result = await extractTransactionsFromText('texto de prueba');

            // Assert - Todas las transacciones deben tener estructura válida
            result.forEach(transaction => {
              expect(transaction).toHaveProperty('description');
              expect(transaction).toHaveProperty('amount');
              expect(transaction).toHaveProperty('date');
              expect(typeof transaction.description).toBe('string');
              expect(typeof transaction.amount).toBe('number');
              expect(transaction.amount).toBeGreaterThan(0);
              expect(transaction.description.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Feature: financeflow-ai, Property 4: Cálculos estadísticos siempre correctos
  describe('[Property] Statistical calculations correctness', () => {
    it('should calculate total amount correctly for any transaction set', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              description: fc.string({ minLength: 1, maxLength: 30 }),
              amount: fc.integer({ min: 1, max: 100000 }),
              date: fc.string(),
              category: fc.option(fc.string(), { nil: undefined })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (transactions) => {
            // Arrange
            const expectedTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
            const mockResponse = {
              choices: [{
                message: {
                  content: 'Narrativa'
                }
              }]
            };

            mockCreate.mockResolvedValue(mockResponse);
            mockGetPlansForAI.mockResolvedValue([]); // Asegurar que retorna array vacío

            // Act
            await generateNarrative(transactions, 'user123');

            // Assert - El prompt debe contener el total correcto
            const callArgs = mockCreate.mock.calls[0][0];
            const prompt = callArgs.messages[0].content;
            
            // Formato español usa punto como separador de miles
            const expectedFormatted = expectedTotal.toLocaleString('es-CO');
            expect(prompt).toContain(expectedFormatted);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
