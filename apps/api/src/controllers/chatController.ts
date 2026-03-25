import { Request, Response } from 'express';
import { processChatMessage, ChatMessage } from '../services/chatService';

export class ChatController {
  /**
   * POST /api/chat/message
   * Procesa un mensaje del usuario y devuelve respuesta del asistente
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { message, conversationHistory } = req.body;

      // Validar mensaje
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ error: 'El mensaje es requerido' });
        return;
      }

      // Validar longitud del mensaje
      if (message.length > 500) {
        res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 500 caracteres)' });
        return;
      }

      // Validar historial de conversación (opcional)
      let history: ChatMessage[] = [];
      if (conversationHistory && Array.isArray(conversationHistory)) {
        // Validar estructura del historial
        const isValidHistory = conversationHistory.every(
          (msg: any) => 
            msg.role && 
            (msg.role === 'user' || msg.role === 'assistant') &&
            msg.content &&
            typeof msg.content === 'string'
        );

        if (!isValidHistory) {
          res.status(400).json({ error: 'Formato de historial de conversación inválido' });
          return;
        }

        history = conversationHistory;
      }

      // Procesar mensaje
      const response = await processChatMessage(userId, message, history);

      res.json({
        success: true,
        response: response.message,
        metadata: {
          transactionsAnalyzed: response.transactionsAnalyzed,
          periodAnalyzed: response.periodAnalyzed,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error en chat controller:', error);
      res.status(500).json({ 
        error: 'Error al procesar el mensaje',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/chat/health
   * Verifica que el servicio de chat esté configurado correctamente
   */
  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const hasApiKey = !!process.env.OPENROUTER_API_KEY;

      res.json({
        status: hasApiKey ? 'ok' : 'error',
        configured: hasApiKey,
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        message: hasApiKey 
          ? 'Servicio de chat configurado correctamente' 
          : 'OPENROUTER_API_KEY no está configurada'
      });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Error al verificar configuración'
      });
    }
  }
}

export const chatController = new ChatController();
