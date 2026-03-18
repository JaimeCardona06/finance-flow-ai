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
 * Generar narrativa financiera usando Gemini 2.5 Flash
 * Implementación basada en la documentación oficial de Google AI
 * 
 * @param transactions - Array de transacciones del usuario
 * @param comparisonData - Datos de comparación mes actual vs anterior (opcional)
 * @returns Narrativa generada por la IA (máx. 3 párrafos)
 */
export async function generateNarrative(
  transactions: TransactionSummary[],
  comparisonData?: {
    currentMonth: { totalAmount: number; month: string };
    previousMonth: { totalAmount: number; month: string };
    delta: { amount: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    improvement: boolean;
  }
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
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

    // Construir contexto histórico si está disponible
    let historicalContext = '';
    if (comparisonData) {
      const { currentMonth, previousMonth, delta, improvement } = comparisonData;
      const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-CO', {
          month: 'long',
          year: 'numeric'
        });
      };

      historicalContext = `
CONTEXTO HISTÓRICO (COMPARACIÓN MENSUAL):
- Mes actual (${formatMonth(currentMonth.month)}): **${currentMonth.totalAmount.toLocaleString('es-CO')} COP**
- Mes anterior (${formatMonth(previousMonth.month)}): **${previousMonth.totalAmount.toLocaleString('es-CO')} COP**
- Diferencia: **${delta.amount > 0 ? '+' : ''}${delta.amount.toLocaleString('es-CO')} COP** (${delta.percentage > 0 ? '+' : ''}${delta.percentage.toFixed(1)}%)
- Tendencia: ${delta.trend === 'down' ? '📉 Reducción' : delta.trend === 'up' ? '📈 Aumento' : '➡️ Estable'}
- ${improvement ? '✅ MEJORA DETECTADA: El usuario redujo sus gastos' : '⚠️ Los gastos aumentaron respecto al mes anterior'}
`;
    }

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

${historicalContext}

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
${comparisonData && comparisonData.improvement ? '- **IMPORTANTE**: Reconoce la mejora respecto al mes anterior. Felicita al usuario por reducir gastos.' : ''}
${comparisonData && !comparisonData.improvement && comparisonData.delta.trend === 'up' ? '- **IMPORTANTE**: Señala que los gastos aumentaron respecto al mes anterior. Identifica qué categoría causó el incremento.' : ''}

**Párrafo 2 - Acción Concreta de Optimización (3-4 líneas):**
- Propón UNA acción específica y medible (ej: "Reducir domicilios de **$50,000** a **$25,000** mensuales")
- Calcula el ahorro ANUAL proyectado
- Presenta el ahorro como oportunidad de inversión o ahorro: "Este capital liberado (**$X COP** anuales) podría destinarse a [fondo de emergencia/inversión/ahorro programado]"
- Termina con el impacto: "Optimizar este gasto hormiga representa **$X COP** anuales de flujo de caja recuperado"
${comparisonData && comparisonData.improvement ? '- **IMPORTANTE**: Motiva al usuario a mantener la racha de mejora. Menciona que va por buen camino.' : ''}

**REGLAS DE TONO:**
1. Profesional y analítico, NO sarcástico ni agresivo
2. Usa términos financieros: "capital", "flujo de caja", "gasto hormiga", "optimización", "eficiencia"
3. NO uses frases como "plata botada", "bolsillo llorando", "se te está yendo"
4. SÍ usa: "capital que no está generando valor", "oportunidad de optimización", "ineficiencia detectada"
5. USA MARKDOWN: **negritas** para TODAS las cifras en COP y nombres de comercios
6. Enfoque en datos duros y oportunidades, no en drama o culpa
7. Menciona el ahorro anual como oportunidad de inversión o ahorro programado
${comparisonData ? '8. **CONTEXTO HISTÓRICO**: Usa la comparación mensual para dar perspectiva. Si mejoró, felicita. Si empeoró, identifica la causa sin juzgar.' : ''}

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
 * Extraer transacciones desde lenguaje natural usando Gemini
 * Soporta jerga colombiana: "50k", "50 lucas", múltiples gastos separados por comas
 * 
 * @param text - Texto del usuario describiendo sus gastos
 * @returns Array de transacciones extraídas
 */
export async function extractTransactionsFromText(text: string): Promise<any[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    const today = new Date().toISOString().split('T')[0];

    const prompt = `Actúa como un extractor de datos financieros experto en jerga colombiana. Del texto del usuario, extrae una LISTA de objetos JSON. Si el usuario menciona varios gastos (separados por comas, "y", o puntos), extráelos todos.

TEXTO DEL USUARIO:
"${text}"

INSTRUCCIONES CRÍTICAS:
1. Extrae TODOS los gastos mencionados (pueden ser múltiples)
2. Cada objeto debe tener:
   - "description": Nombre limpio del gasto (ej: "Starbucks", "Gasolina", "Arriendo")
   - "amount": Número entero en COP (ej: si dice "50k" o "50 lucas", devuelve 50000; si dice "15k", devuelve 15000; si dice "200", devuelve 200000 si el contexto indica que son miles)
   - "date": Formato ISO YYYY-MM-DD (asume hoy: ${today} si no se especifica; si dice "ayer", usa ${new Date(Date.now() - 86400000).toISOString().split('T')[0]})
   - "category": Elige la más adecuada entre ["café/bebidas", "comida rápida", "transporte", "suscripciones", "entretenimiento", "misceláneos"]

3. JERGA COLOMBIANA:
   - "k" o "lucas" = mil (ej: "50k" = 50000, "50 lucas" = 50000)
   - "palos" = millones (ej: "2 palos" = 2000000)
   - Si solo dice un número sin unidad y es menor a 1000, asume que son miles (ej: "200" en contexto de arriendo = 200000)

4. CATEGORÍAS:
   - café/bebidas: Café, tinto, bebidas
   - comida rápida: Almuerzo, comida, restaurante, domicilio, Rappi, Uber Eats
   - transporte: Uber, taxi, gasolina, DiDi, bus, metro
   - suscripciones: Netflix, Spotify, HBO, servicios mensuales
   - entretenimiento: Cine, concierto, bar, rumba
   - misceláneos: Arriendo, servicios, compras, otros

5. Responde ÚNICAMENTE con el array de JSON, sin texto adicional, sin markdown, sin explicaciones.

FORMATO DE RESPUESTA (ejemplo):
[
  {"description": "Almuerzo", "amount": 15000, "date": "${today}", "category": "comida rápida"},
  {"description": "Gasolina", "amount": 50000, "date": "${today}", "category": "transporte"}
]

GENERA EL ARRAY JSON:`;

    // Configurar Gemini para respuesta JSON
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "models/gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3, // Más determinístico para extracción
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    let responseText = response.text();

    // Limpiar respuesta (por si viene con markdown)
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Parsear JSON
    const transactions = JSON.parse(responseText);

    // Validar que sea un array
    if (!Array.isArray(transactions)) {
      throw new Error('La respuesta no es un array válido');
    }

    // Validar estructura de cada transacción
    const validTransactions = transactions.filter(t => 
      t.description && 
      typeof t.amount === 'number' && 
      t.amount > 0 &&
      t.date
    );

    return validTransactions;

  } catch (error) {
    console.error('Error al extraer transacciones con Gemini:', error);
    throw error;
  }
}

/**
 * Validar que la API key esté configurada
 */
export function validateGeminiConfig(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
