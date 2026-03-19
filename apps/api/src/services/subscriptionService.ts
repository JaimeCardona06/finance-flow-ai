import { Transaction } from '../models/Transaction';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SubscriptionCandidate {
  normalizedName: string;
  originalNames: string[];
  amount: number;
  occurrences: number;
  dates: string[];
  transactionIds: string[];
}

interface DetectedSubscription {
  serviceName: string;
  amount: number;
  frequency: number;
  monthlyEstimate: number;
  annualEstimate: number;
  lastCharge: string;
  transactions: string[];
}

/**
 * Normalizar nombre de merchant para comparación
 * Quita tildes, minúsculas, elimina extensiones comunes
 */
function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\.(com|co|net|org|io)/gi, '') // Quitar extensiones
    .replace(/\b(sas|s\.a\.s|ltda|s\.a|inc|llc|servicios|colombia)\b/gi, '') // Quitar sufijos empresariales
    .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales
    .trim();
}

/**
 * Calcular similitud entre dos strings (Levenshtein simplificado)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Si uno contiene al otro, alta similitud
  if (longer.includes(shorter)) return 0.9;
  
  // Calcular distancia de edición simple
  let distance = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] !== shorter[i]) distance++;
  }
  distance += longer.length - shorter.length;
  
  return (longer.length - distance) / longer.length;
}

/**
 * Agrupar transacciones por monto similar y nombre similar
 */
function groupTransactionsByPattern(transactions: any[]): SubscriptionCandidate[] {
  const groups: Map<string, SubscriptionCandidate> = new Map();
  
  for (const transaction of transactions) {
    const normalizedName = normalizeMerchantName(transaction.description);
    const amount = transaction.amount;
    
    // Buscar grupo existente con monto similar (varianza < 1%)
    let foundGroup = false;
    
    for (const [key, group] of groups.entries()) {
      const amountVariance = Math.abs(group.amount - amount) / group.amount;
      const nameSimilarity = calculateSimilarity(group.normalizedName, normalizedName);
      
      // Criterios de agrupación:
      // 1. Monto idéntico o varianza < 1%
      // 2. Nombre similar (> 70% de similitud)
      if (amountVariance < 0.01 && nameSimilarity > 0.7) {
        group.occurrences++;
        group.dates.push(transaction.date);
        group.transactionIds.push(transaction._id.toString());
        group.originalNames.push(transaction.description);
        foundGroup = true;
        break;
      }
    }
    
    // Si no encontró grupo, crear uno nuevo
    if (!foundGroup) {
      groups.set(normalizedName, {
        normalizedName,
        originalNames: [transaction.description],
        amount,
        occurrences: 1,
        dates: [transaction.date],
        transactionIds: [transaction._id.toString()]
      });
    }
  }
  
  return Array.from(groups.values());
}

/**
 * Filtrar candidatos que califican como suscripciones
 * Criterio: al menos 2 ocurrencias en meses diferentes
 */
function filterSubscriptionCandidates(candidates: SubscriptionCandidate[]): SubscriptionCandidate[] {
  return candidates.filter(candidate => {
    if (candidate.occurrences < 2) return false;
    
    // Verificar que las fechas estén en meses diferentes
    const months = new Set(
      candidate.dates.map(date => {
        const d = new Date(date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    
    return months.size >= 2;
  });
}

/**
 * Refinar nombre de servicio usando IA (Gemini)
 * Para casos donde hay variaciones del nombre
 */
async function refineServiceNameWithAI(originalNames: string[]): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY no configurada, usando nombre más común');
      // Fallback: retornar el nombre más común
      const nameCounts = originalNames.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(nameCounts).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'models/gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50
      }
    });
    
    const prompt = `Estas son variaciones del nombre de un mismo servicio de suscripción:
${originalNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

¿Cuál es el nombre canónico y limpio de este servicio? Responde SOLO con el nombre, sin explicaciones.
Ejemplo: Si ves "Netflix Colombia", "Netflix.com", "NETFLIX" → responde "Netflix"`;
    
    const result = await model.generateContent(prompt);
    const refinedName = result.response.text().trim();
    
    // console.log(`✨ [IA] Nombres originales: ${originalNames.join(', ')} → Refinado: ${refinedName}`);
    
    return refinedName;
    
  } catch (error: any) {
    // Si es error de cuota (429), usar fallback silenciosamente
    if (error?.status === 429) {
      console.warn('⚠️ Cuota de Gemini excedida, usando fallback para nombres');
    } else {
      console.error('Error al refinar nombre con IA:', error);
    }
    
    // Fallback mejorado: retornar el nombre más común de la lista
    const nameCounts = originalNames.reduce((acc, name) => {
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Si hay empate, usar el más corto
    const sortedByFrequency = Object.entries(nameCounts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // Por frecuencia
      return a[0].length - b[0].length; // Por longitud si hay empate
    });
    
    return sortedByFrequency[0][0];
  }
}

/**
 * Detectar suscripciones del usuario
 */
export async function detectSubscriptions(userId: string): Promise<DetectedSubscription[]> {
  try {
    // console.log(`🔍 [Subscriptions] Detectando suscripciones para usuario ${userId}`);
    
    // Obtener transacciones de los últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const transactions = await Transaction.find({
      userId,
      date: { $gte: sixMonthsAgo.toISOString().split('T')[0] }
    }).sort({ date: -1 }).lean();
    
    // console.log(`📊 [Subscriptions] Analizando ${transactions.length} transacciones`);
    
    if (transactions.length === 0) {
      return [];
    }
    
    // 1. Agrupar por patrón (monto + nombre similar)
    const candidates = groupTransactionsByPattern(transactions);
    // console.log(`🔗 [Subscriptions] ${candidates.length} grupos encontrados`);
    
    // 2. Filtrar candidatos que califican como suscripciones
    const subscriptionCandidates = filterSubscriptionCandidates(candidates);
    // console.log(`✅ [Subscriptions] ${subscriptionCandidates.length} suscripciones detectadas`);
    
    // 3. Refinar nombres con IA (secuencialmente con delay para respetar rate limits)
    const detectedSubscriptions: DetectedSubscription[] = [];
    
    for (const candidate of subscriptionCandidates) {
      const refinedName = await refineServiceNameWithAI(candidate.originalNames);
      
      // Calcular frecuencia (días entre cargos)
      const sortedDates = candidate.dates.sort();
      const daysBetweenCharges = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = Math.abs(
          new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()
        );
        daysBetweenCharges.push(Math.round(diff / (1000 * 60 * 60 * 24)));
      }
      const avgFrequency = daysBetweenCharges.length > 0
        ? Math.round(daysBetweenCharges.reduce((a, b) => a + b, 0) / daysBetweenCharges.length)
        : 30;
      
      // Estimar costo mensual y anual
      const monthlyEstimate = avgFrequency <= 35 ? candidate.amount : Math.round((candidate.amount * 30) / avgFrequency);
      const annualEstimate = monthlyEstimate * 12;
      
      detectedSubscriptions.push({
        serviceName: refinedName,
        amount: candidate.amount,
        frequency: avgFrequency,
        monthlyEstimate,
        annualEstimate,
        lastCharge: sortedDates[sortedDates.length - 1],
        transactions: candidate.transactionIds
      });
      
      // Delay de 1 segundo entre llamadas para respetar rate limits (5 req/min)
      if (subscriptionCandidates.indexOf(candidate) < subscriptionCandidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Ordenar por costo mensual (mayor a menor)
    return detectedSubscriptions.sort((a, b) => b.monthlyEstimate - a.monthlyEstimate);
    
  } catch (error) {
    console.error('Error al detectar suscripciones:', error);
    throw error;
  }
}
