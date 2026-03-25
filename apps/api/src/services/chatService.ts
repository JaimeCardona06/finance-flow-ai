import OpenAI from 'openai';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { savingsPlanService } from './savingsPlanService';

/**
 * Persona del estratega financiero colombiano premium
 * Reutilizado de aiService.ts
 */
const SYSTEM_PERSONA = `Eres un estratega financiero colombiano de alto nivel. Tu tono es profesional, analítico y directo, con un toque de jerga local sofisticada (ej: usar "capital", "flujo de caja", "gasto hormiga", "bolsillo"). No eres grosero ni usas frases como "bolsillo llorando". Tu objetivo es mostrar ineficiencias con datos duros. Conoces el contexto local: Rappi y Uber Eats son domicilios, Juan Valdez y Starbucks son café premium, Uber y DiDi son transporte.

Respondes preguntas específicas del usuario sobre sus finanzas personales. Tus respuestas son:
- Concisas (máximo 300 palabras)
- Basadas en datos reales del usuario
- Accionables (siempre incluyes una sugerencia concreta)
- Empáticas pero directas
- Usan markdown para resaltar cifras importantes con **negritas**

Cuando el usuario pregunta sobre sus gastos, analizas sus transacciones reales y das respuestas específicas con números exactos.`;

/**
 * Interface para mensaje de chat
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Interface para respuesta del chat
 */
export interface ChatResponse {
  message: string;
  transactionsAnalyzed: number;
  periodAnalyzed: string;
}

/**
 * Procesar mensaje de chat del usuario
 * Recupera transacciones reales de los últimos 30 días y genera respuesta contextualizada
 * 
 * @param userId - ID del usuario
 * @param userMessage - Mensaje del usuario
 * @param conversationHistory - Historial de conversación (opcional)
 * @returns Respuesta del asistente con contexto
 */
export async function processChatMessage(
  userId: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY no está configurada');
    }

    console.log('🔍 [ChatService] Procesando mensaje para userId:', userId);

    // Obtener transacciones de los últimos 30 días
    // Usar inicio del día hace 30 días hasta el final del día de hoy
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final del día de hoy
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Inicio del día hace 30 días

    console.log('📅 [ChatService] Rango de fechas:', {
      desde: thirtyDaysAgo.toISOString(),
      hasta: today.toISOString()
    });

    // Convertir userId string a ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const transactions = await Transaction.find({
      userId: userObjectId,
      date: { 
        $gte: thirtyDaysAgo.toISOString(),
        $lte: today.toISOString()
      }
    })
      .sort({ date: -1 })
      .limit(500)
      .lean();

    console.log('📊 [ChatService] Transacciones encontradas:', transactions.length);

    // Si no hay transacciones, devolver mensaje informativo
    if (transactions.length === 0) {
      console.log('⚠️ [ChatService] No se encontraron transacciones para el usuario');
      return {
        message: '⚠️ No encontré transacciones en los últimos 30 días. Asegúrate de haber importado tus datos bancarios para que pueda ayudarte con el análisis.',
        transactionsAnalyzed: 0,
        periodAnalyzed: '30 días'
      };
    }

    // Calcular estadísticas básicas
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = transactions.length;

    console.log('💰 [ChatService] Total gastado:', totalAmount.toLocaleString('es-CO'), 'COP');

    // Agrupar por categoría
    const categoryTotals: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    
    transactions.forEach(t => {
      const cat = t.category || 'Sin categoría';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categorySummary = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => `- **${cat}**: ${amount.toLocaleString('es-CO')} COP (${categoryCount[cat]} transacciones)`)
      .join('\n');

    // Identificar merchants más frecuentes
    const merchantTotals: Record<string, { count: number; total: number }> = {};
    
    transactions.forEach(t => {
      const merchant = t.merchant || t.description.split(' ')[0];
      if (!merchantTotals[merchant]) {
        merchantTotals[merchant] = { count: 0, total: 0 };
      }
      merchantTotals[merchant].count++;
      merchantTotals[merchant].total += t.amount;
    });

    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([merchant, data]) => `- **${merchant}**: ${data.total.toLocaleString('es-CO')} COP (${data.count} veces)`)
      .join('\n');

    // Obtener planes activos del usuario (Slice 5 - Integración con Chat)
    let plansContext = '';
    try {
      console.log('🎯 [ChatService] Obteniendo planes de ahorro activos...');
      const activePlans = await savingsPlanService.getPlansForAI(userId);

      if (activePlans.length > 0) {
        console.log(`📋 [ChatService] ${activePlans.length} plan(es) activo(s) encontrado(s)`);
        
        // REGLA DE NEGOCIO: El presupuesto es retroactivo al mes calendario actual
        // Recalcular el progreso real basado en TODAS las transacciones del mes actual
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        const lastDayOfMonth = new Date();
        lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
        lastDayOfMonth.setDate(0);
        lastDayOfMonth.setHours(23, 59, 59, 999);

        console.log('📅 [ChatService] Recalculando progreso para mes calendario:', {
          desde: firstDayOfMonth.toISOString(),
          hasta: lastDayOfMonth.toISOString()
        });

        // Recalcular el gasto real de cada categoría en el mes calendario
        const plansWithRealProgress = await Promise.all(activePlans.map(async (plan) => {
          // Buscar TODAS las transacciones de esta categoría en el mes actual
          const categoryTransactions = await Transaction.find({
            userId: userObjectId,
            category: plan.category,
            date: {
              $gte: firstDayOfMonth.toISOString(),
              $lte: lastDayOfMonth.toISOString()
            }
          }).lean();

          const realCurrentAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
          const realProgressPercentage = Math.round((realCurrentAmount / plan.targetAmount) * 100);
          
          // Determinar color basado en progreso REAL
          let realStatusColor: 'green' | 'yellow' | 'red';
          if (realProgressPercentage >= 100) {
            realStatusColor = 'red';
          } else if (realProgressPercentage >= 80) {
            realStatusColor = 'yellow';
          } else {
            realStatusColor = 'green';
          }

          // Calcular días restantes del mes
          const today = new Date();
          const daysInMonth = lastDayOfMonth.getDate();
          const currentDay = today.getDate();
          const daysRemaining = daysInMonth - currentDay;

          console.log(`💰 [ChatService] Plan ${plan.category}:`, {
            meta: plan.targetAmount,
            gastadoReal: realCurrentAmount,
            progreso: `${realProgressPercentage}%`,
            estado: realStatusColor
          });

          return {
            ...plan,
            currentAmount: realCurrentAmount,
            progressPercentage: realProgressPercentage,
            statusColor: realStatusColor,
            daysRemaining
          };
        }));
        
        plansContext = `

🎯 PLANES DE AHORRO ACTIVOS DEL USUARIO (CRÍTICO - DEBES MENCIONARLOS):
⚠️ **IMPORTANTE**: Los planes son retroactivos al mes calendario actual (desde el 1 del mes).
El usuario tiene ${plansWithRealProgress.length} ${plansWithRealProgress.length === 1 ? 'plan activo' : 'planes activos'}:

${plansWithRealProgress.map(plan => {
          const statusEmoji = plan.statusColor === 'green' ? '🟢' : plan.statusColor === 'yellow' ? '🟡' : '🔴';
          const statusText = plan.statusColor === 'green'
            ? 'DENTRO DEL LÍMITE'
            : plan.statusColor === 'yellow'
              ? '⚠️ ALERTA - CERCA DEL LÍMITE'
              : '🚨 LÍMITE SUPERADO';
          
          const overspend = plan.currentAmount - plan.targetAmount;

          return `${statusEmoji} **${plan.category.toUpperCase()}**: ${plan.progressPercentage}% (${statusText})
   - Gastado este mes: **${plan.currentAmount.toLocaleString('es-CO')} COP** de **${plan.targetAmount.toLocaleString('es-CO')} COP**
   ${overspend > 0 ? `- **SOBREGIRO**: **${overspend.toLocaleString('es-CO')} COP** por encima del límite` : `- Margen restante: **${(plan.targetAmount - plan.currentAmount).toLocaleString('es-CO')} COP**`}
   - Días restantes del mes: ${plan.daysRemaining}
   - Estado: ${plan.statusColor === 'green' ? '✅ Bien encaminado' : plan.statusColor === 'yellow' ? '⚠️ Requiere atención inmediata' : '❌ Meta fallida este mes'}`;
        }).join('\n\n')}

**INSTRUCCIONES OBLIGATORIAS SOBRE PLANES:**
${plansWithRealProgress.some(p => p.statusColor === 'red') ? `
🚨 **PLANES EN ROJO (>= 100%) - SÉ DIRECTO Y FIRME:**
${plansWithRealProgress.filter(p => p.statusColor === 'red').map(p => {
          const overspend = p.currentAmount - p.targetAmount;
          return `- **${p.category}**: El usuario quería limitarse a **${p.targetAmount.toLocaleString('es-CO')} COP**, pero este mes ya lleva **${p.currentAmount.toLocaleString('es-CO')} COP**. Está en sobregiro por **${overspend.toLocaleString('es-CO')} COP**.
  * **TONO DIRECTO**: "Veo que quieres limitarte a ${p.targetAmount.toLocaleString('es-CO')} COP en ${p.category}, pero este mes ya llevas ${p.currentAmount.toLocaleString('es-CO')} COP. Estás en sobregiro por ${overspend.toLocaleString('es-CO')} COP."
  * **NO SUGIERAS FLEXIBILIDAD**: No digas "está bien" o "puedes ajustar". Sé firme.
  * **ENFOQUE EN DISCIPLINA**: Sugiere recortes drásticos para el próximo mes. Ejemplo: "Para el próximo mes, necesitas disciplina: reduce ${p.category} a la mitad o elimínalo por completo."
  * **CONSECUENCIAS**: Menciona el impacto anual si continúa así.`;
        }).join('\n\n')}
` : ''}
${plansWithRealProgress.some(p => p.statusColor === 'yellow') ? `
🟡 **PLANES EN AMARILLO (80-99%) - ALERTA PROACTIVA:**
${plansWithRealProgress.filter(p => p.statusColor === 'yellow').map(p =>
          `- **${p.category}**: Estás al ${p.progressPercentage}% del límite (**${p.currentAmount.toLocaleString('es-CO')} COP** de **${p.targetAmount.toLocaleString('es-CO')} COP**). Solo quedan **${(p.targetAmount - p.currentAmount).toLocaleString('es-CO')} COP** de margen y ${p.daysRemaining} días del mes.
  * **GENERA UN "PLAN DE EMERGENCIA" ESPECÍFICO**: Sugiere acciones concretas para no superar el límite (ej: "Evita ${p.category} completamente esta semana", "Usa alternativas más económicas los próximos ${p.daysRemaining} días").
  * **SÉ URGENTE**: Usa frases como "URGENTE", "CRÍTICO", "ÚLTIMOS DÍAS".`
        ).join('\n\n')}
` : ''}
${plansWithRealProgress.some(p => p.statusColor === 'green') ? `
🟢 **PLANES EN VERDE (< 80%):**
${plansWithRealProgress.filter(p => p.statusColor === 'green').map(p =>
          `- **${p.category}**: Vas excelente al ${p.progressPercentage}% del límite. Felicita al usuario por mantener la disciplina. Menciona cuánto margen le queda (**${(p.targetAmount - p.currentAmount).toLocaleString('es-CO')} COP**) y motívalo a mantener el ritmo.`
        ).join('\n\n')}
` : ''}

**REGLA DE ORO:** Si hay planes activos, DEBES mencionarlos en tu respuesta. No los ignores. Son el contexto más importante para el usuario.
**PRIORIDAD:** Si ves un plan en rojo (🔴), sé DIRECTO y FIRME. No suavices el mensaje. El usuario necesita disciplina, no flexibilidad.
**TONO PARA ROJOS:** Usa frases como "estás en sobregiro", "necesitas disciplina", "recortes drásticos", "elimínalo por completo".
`;
      } else {
        console.log('ℹ️ [ChatService] No hay planes activos');
      }
    } catch (error) {
      console.error('⚠️ [ChatService] Error al obtener planes activos:', error);
      // Continuar sin contexto de planes si falla
    }

    // Construir contexto financiero del usuario
    const financialContext = `
CONTEXTO FINANCIERO DEL USUARIO (ÚLTIMOS 30 DÍAS):

📊 RESUMEN GENERAL:
- Total gastado: **${totalAmount.toLocaleString('es-CO')} COP**
- Número de transacciones: ${transactionCount}
- Promedio por transacción: **${Math.round(totalAmount / transactionCount).toLocaleString('es-CO')} COP**

📁 GASTOS POR CATEGORÍA:
${categorySummary}

🏪 COMERCIOS MÁS FRECUENTES:
${topMerchants}

📝 ÚLTIMAS 10 TRANSACCIONES:
${transactions.slice(0, 10).map(t => 
  `- **${t.description}**: ${t.amount.toLocaleString('es-CO')} COP (${new Date(t.date).toLocaleDateString('es-CO')})`
).join('\n')}

${plansContext}

INSTRUCCIONES PARA RESPONDER:
1. Usa los datos anteriores para responder la pregunta del usuario
2. Sé específico con cifras exactas (usa los datos reales)
3. Si el usuario pregunta por una categoría, busca en el desglose
4. Si pregunta por un merchant específico, busca en las transacciones
5. **CRÍTICO**: Si hay planes de ahorro activos, DEBES mencionarlos en tu respuesta
6. **PRIORIDAD**: Si hay planes en rojo (🔴) o amarillo (🟡), prioriza dar consejos sobre esas categorías
7. Siempre termina con una sugerencia accionable
8. Usa markdown para resaltar cifras: **${totalAmount.toLocaleString('es-CO')} COP**
9. Máximo 300 palabras en tu respuesta
10. Si no tienes datos suficientes para responder, dilo claramente

PREGUNTA DEL USUARIO:
"${userMessage}"

GENERA TU RESPUESTA:`;

    console.log('🤖 [ChatService] Enviando contexto a IA...');

    // Configurar OpenAI client para OpenRouter
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Construir mensajes para la conversación
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PERSONA },
      ...conversationHistory.slice(-6), // Últimos 3 intercambios (6 mensajes)
      { role: 'user', content: financialContext }
    ];

    // Generar respuesta usando Llama 3.1
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content || 
      'Lo siento, no pude procesar tu pregunta. Por favor intenta de nuevo.';

    console.log('✅ [ChatService] Respuesta generada exitosamente');

    return {
      message: assistantMessage.trim(),
      transactionsAnalyzed: transactionCount,
      periodAnalyzed: '30 días'
    };

  } catch (error) {
    console.error('❌ [ChatService] Error al procesar mensaje de chat:', error);
    
    // Fallback en caso de error
    return {
      message: '⚠️ Lo siento, tuve un problema al analizar tus datos. Por favor intenta de nuevo en unos momentos.',
      transactionsAnalyzed: 0,
      periodAnalyzed: '30 días'
    };
  }
}

/**
 * Validar que la API key de OpenRouter esté configurada
 */
export function validateChatConfig(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
