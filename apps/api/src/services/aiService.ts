import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Persona del estratega financiero colombiano premium
 */
const SYSTEM_PERSONA = `Eres un estratega financiero colombiano de alto nivel. Tu tono es profesional, analítico y directo, con un toque de jerga local sofisticada (ej: usar "capital", "flujo de caja", "gasto hormiga", "bolsillo"). No eres grosero ni usas frases como "bolsillo llorando". Tu objetivo es mostrar ineficiencias con datos duros. Conoces el contexto local: Rappi y Uber Eats son domicilios, Juan Valdez y Starbucks son café premium, Uber y DiDi son transporte.`;

/**
 * Interface para transacción simplificada
 */
interface TransactionSummary {
  description: string;
  amount: number;
  date: string;
  category?: string;
}

/**
 * Generar narrativa financiera usando Gemini 1.5 Flash
 * Implementación basada en la documentación oficial de Google AI
 * 
 * @param transactions - Array de transacciones del usuario
 * @returns Narrativa generada por la IA (máx. 3 párrafos)
 */
export async function generateNarrative(
  transactions: TransactionSummary[]
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log('🔑 [aiService] Clave Gemini detectada:', apiKey ? 'SÍ' : 'NO');
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    if (transactions.length === 0) {
      return 'No hay transacciones para analizar. Importa tus datos bancarios para comenzar.';
    }

    // Calcular estadísticas básicas
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / transactions.length;
    const categories = transactions
      .filter(t => t.category)
      .reduce((acc, t) => {
        const cat = t.category!;
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Agrupar por categoría
    const categoryDetails = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => `${cat}: **${amount.toLocaleString('es-CO')} COP**`)
      .join(', ');

    // Identificar el gasto más frecuente
    const merchantFrequency: Record<string, { count: number; total: number }> = {};
    transactions.forEach(t => {
      const merchant = t.description.split(' ')[0];
      if (!merchantFrequency[merchant]) {
        merchantFrequency[merchant] = { count: 0, total: 0 };
      }
      merchantFrequency[merchant].count++;
      merchantFrequency[merchant].total += t.amount;
    });

    const topMerchant = Object.entries(merchantFrequency)
      .sort((a, b) => b[1].total - a[1].total)[0];

    // Construir prompt con enfoque premium
    const prompt = `${SYSTEM_PERSONA}

Analiza las transacciones y genera una narrativa profesional de máximo 2 párrafos. Identifica ineficiencias en el flujo de caja y cuantifica oportunidades de optimización.

DATOS CLAVE:
- Capital total desembolsado: **${totalAmount.toLocaleString('es-CO')} COP**
- Número de transacciones: ${transactions.length}
- Ticket promedio: **${Math.round(avgAmount).toLocaleString('es-CO')} COP**

DESGLOSE POR CATEGORÍA:
${categoryDetails}

COMERCIO MÁS FRECUENTE:
- **${topMerchant?.[0] || 'N/A'}**: ${topMerchant?.[1].count || 0} transacciones, **${(topMerchant?.[1].total || 0).toLocaleString('es-CO')} COP** acumulados

TODAS LAS TRANSACCIONES:
${transactions.map(t => 
  `- **${t.description}**: ${t.amount.toLocaleString('es-CO')} COP`
).join('\n')}

INSTRUCCIONES CRÍTICAS:

**ESTRUCTURA OBLIGATORIA:**

**Párrafo 1 - Análisis del Comportamiento Actual (3-4 líneas):**
- Identifica ESPECÍFICAMENTE qué categoría o comercio representa la mayor fuga de capital
- Menciona los comercios por nombre (ej: **Rappi**, **Starbucks**, **Uber**)
- Cuantifica el gasto total en esa categoría: "Has destinado **$X COP** a [categoría específica]"
- Calcula la frecuencia: "Esto representa X transacciones en el período analizado"

**Párrafo 2 - Acción Concreta de Optimización (3-4 líneas):**
- Propón UNA acción específica y medible (ej: "Reducir domicilios de **$50,000** a **$25,000** mensuales")
- Calcula el ahorro ANUAL proyectado
- Presenta el ahorro como oportunidad de inversión o ahorro: "Este capital liberado (**$X COP** anuales) podría destinarse a [fondo de emergencia/inversión/ahorro programado]"
- Termina con el impacto: "Optimizar este gasto hormiga representa **$X COP** anuales de flujo de caja recuperado"

**REGLAS DE TONO:**
1. Profesional y analítico, NO sarcástico ni agresivo
2. Usa términos financieros: "capital", "flujo de caja", "gasto hormiga", "optimización", "eficiencia"
3. NO uses frases como "plata botada", "bolsillo llorando", "se te está yendo"
4. SÍ usa: "capital que no está generando valor", "oportunidad de optimización", "ineficiencia detectada"
5. USA MARKDOWN: **negritas** para TODAS las cifras en COP y nombres de comercios
6. Enfoque en datos duros y oportunidades, no en drama o culpa
7. Menciona el ahorro anual como oportunidad de inversión o ahorro programado

GENERA LA NARRATIVA EN MARKDOWN:`;

    // Configurar Gemini según documentación oficial
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usar modelo con prefijo 'models/' según documentación oficial
    const model = genAI.getGenerativeModel({ 
      model: "models/gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,      // Creatividad moderada para narrativas
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    
    // Generar contenido
    const result = await model.generateContent(prompt);
    const response = result.response;
    const narrative = response.text();

    return narrative.trim();

  } catch (error) {
    console.error('Error al generar narrativa con Gemini:', error);
    
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Fallback: narrativa básica sin IA
    return `⚠️ **Análisis básico (sin IA)**

He analizado tus ${transactions.length} transacciones por un total de **${totalAmount.toLocaleString('es-CO')} COP**.

**Gastos principales:**
${transactions.slice(0, 5).map(t => `- **${t.description}**: ${t.amount.toLocaleString('es-CO')} COP`).join('\n')}

**Nota:** La conexión con Gemini falló. Verifica que tu API Key sea válida y esté generada desde [Google AI Studio](https://aistudio.google.com/app/apikey).`;
  }
}

/**
 * Validar que la API key esté configurada
 */
export function validateGeminiConfig(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
