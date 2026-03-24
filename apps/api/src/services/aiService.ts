import OpenAI from 'openai';
import { savingsPlanService } from './savingsPlanService';

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
 * @param userId - ID del usuario para obtener sus planes activos
 * @param comparisonData - Datos de comparación mes actual vs anterior (opcional)
 * @returns Narrativa generada por la IA (máx. 3 párrafos)
 */
export async function generateNarrative(
  transactions: TransactionSummary[],
  userId: string,
  comparisonData?: {
    currentMonth: { totalAmount: number; month: string };
    previousMonth: { totalAmount: number; month: string };
    delta: { amount: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    improvement: boolean;
  }
): Promise<string> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY no está configurada');
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

    // Obtener planes activos del usuario (Slice 5 - Fase 3)
    let plansContext = '';
    try {
      const activePlans = await savingsPlanService.getPlansForAI(userId);

      if (activePlans.length > 0) {
        plansContext = `
🎯 METAS DE AHORRO ACTIVAS (CRÍTICO - DEBES MENCIONARLAS):
El usuario tiene ${activePlans.length} ${activePlans.length === 1 ? 'meta activa' : 'metas activas'}:

${activePlans.map(plan => {
          const statusEmoji = plan.statusColor === 'green' ? '🟢' : plan.statusColor === 'yellow' ? '🟡' : '🔴';
          const statusText = plan.statusColor === 'green'
            ? 'DENTRO DEL LÍMITE'
            : plan.statusColor === 'yellow'
              ? '⚠️ ALERTA - CERCA DEL LÍMITE'
              : '🚨 LÍMITE SUPERADO';

          return `${statusEmoji} **${plan.category.toUpperCase()}**: ${plan.progressPercentage}% (${statusText})
   - Gastado: **${plan.currentAmount.toLocaleString('es-CO')} COP** de **${plan.targetAmount.toLocaleString('es-CO')} COP**
   - Días restantes: ${plan.daysRemaining}
   - Estado: ${plan.statusColor === 'green' ? '✅ Bien encaminado' : plan.statusColor === 'yellow' ? '⚠️ Requiere atención inmediata' : '❌ Meta fallida este período'}`;
        }).join('\n\n')}

**INSTRUCCIONES OBLIGATORIAS SOBRE METAS:**
${activePlans.some(p => p.statusColor === 'red') ? `
🚨 **METAS EN ROJO (>= 100%):**
${activePlans.filter(p => p.statusColor === 'red').map(p =>
          `- **${p.category}**: Superaste el límite en **${(p.currentAmount - p.targetAmount).toLocaleString('es-CO')} COP**. Reconoce el exceso sin juzgar. Motiva a ajustar el límite o reducir gastos para el próximo período. Usa un tono de "aprendizaje" no de "fracaso".`
        ).join('\n')}
` : ''}
${activePlans.some(p => p.statusColor === 'yellow') ? `
🟡 **METAS EN AMARILLO (80-99%) - ALERTA PROACTIVA:**
${activePlans.filter(p => p.statusColor === 'yellow').map(p =>
          `- **${p.category}**: Estás al ${p.progressPercentage}% del límite (**${p.currentAmount.toLocaleString('es-CO')} COP** de **${p.targetAmount.toLocaleString('es-CO')} COP**). Solo quedan **${(p.targetAmount - p.currentAmount).toLocaleString('es-CO')} COP** de margen y ${p.daysRemaining} días. GENERA UN "PLAN DE EMERGENCIA" ESPECÍFICO: sugiere acciones concretas para no superar el límite (ej: "Evita domicilios esta semana", "Usa transporte público los próximos días").`
        ).join('\n')}
` : ''}
${activePlans.some(p => p.statusColor === 'green') ? `
🟢 **METAS EN VERDE (< 80%):**
${activePlans.filter(p => p.statusColor === 'green').map(p =>
          `- **${p.category}**: Vas excelente al ${p.progressPercentage}% del límite. Felicita al usuario por mantener la disciplina. Menciona cuánto margen le queda (**${(p.targetAmount - p.currentAmount).toLocaleString('es-CO')} COP**) y motívalo a mantener el ritmo.`
        ).join('\n')}
` : ''}

**REGLA DE ORO:** Si hay metas activas, DEBES mencionarlas en tu narrativa. No las ignores. Son el contexto más importante para el usuario.
`;
      }
    } catch (error) {
      console.error('Error al obtener planes activos para IA:', error);
      // Continuar sin contexto de planes si falla
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

${plansContext}

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
${plansContext ? '- **CRÍTICO**: Si hay metas activas, menciónalas aquí. Si alguna está en amarillo o rojo, haz una alerta proactiva.' : ''}

**Párrafo 2 - Acción Concreta de Optimización (3-4 líneas):**
- Propón UNA acción específica y medible (ej: "Reducir domicilios de **$50,000** a **$25,000** mensuales")
- Calcula el ahorro ANUAL proyectado
- Presenta el ahorro como oportunidad de inversión o ahorro: "Este capital liberado (**$X COP** anuales) podría destinarse a [fondo de emergencia/inversión/ahorro programado]"
- Termina con el impacto: "Optimizar este gasto hormiga representa **$X COP** anuales de flujo de caja recuperado"
${comparisonData && comparisonData.improvement ? '- **IMPORTANTE**: Motiva al usuario a mantener la racha de mejora. Menciona que va por buen camino.' : ''}
${plansContext ? '- **CRÍTICO**: Si hay metas en amarillo, propón un "Plan de Emergencia" para no superarlas. Si hay metas en rojo, motiva sin juzgar y sugiere ajustar el límite para el próximo período. Si hay metas en verde, felicita por la disciplina.' : ''}

**REGLAS DE TONO:**
1. Profesional y analítico, NO sarcástico ni agresivo
2. Usa términos financieros: "capital", "flujo de caja", "gasto hormiga", "optimización", "eficiencia"
3. NO uses frases como "plata botada", "bolsillo llorando", "se te está yendo"
4. SÍ usa: "capital que no está generando valor", "oportunidad de optimización", "ineficiencia detectada"
5. USA MARKDOWN: **negritas** para TODAS las cifras en COP y nombres de comercios
6. Enfoque en datos duros y oportunidades, no en drama o culpa
7. Menciona el ahorro anual como oportunidad de inversión o ahorro programado
${comparisonData ? '8. **CONTEXTO HISTÓRICO**: Usa la comparación mensual para dar perspectiva. Si mejoró, felicita. Si empeoró, identifica la causa sin juzgar.' : ''}
${plansContext ? '9. **METAS DE AHORRO**: Si el usuario tiene metas activas, DEBES mencionarlas. Son su prioridad. Usa emojis: 🟢 (bien), 🟡 (cuidado), 🔴 (superado).' : ''}

GENERA LA NARRATIVA EN MARKDOWN:`;

    // Configurar OpenAI client para OpenRouter
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Generar contenido usando OpenAI SDK
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 8192,
    });

    const narrative = response.choices[0]?.message?.content || '';
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
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY no está configurada');
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

    // Configurar OpenAI client para OpenRouter
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: "json_object" }
    });

    let responseText = response.choices[0]?.message?.content || '[]';

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
 * Validar que la API key de OpenRouter esté configurada
 */
export function validateGeminiConfig(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
