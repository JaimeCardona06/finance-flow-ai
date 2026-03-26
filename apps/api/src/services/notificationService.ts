import mongoose from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/Notification';
import { NotificationPreference, INotificationPreference } from '../models/NotificationPreference';

/**
 * Interface para datos de creación de notificación
 */
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * Interface para actualización de preferencias
 */
export interface UpdatePreferencesData {
  subscriptionAlerts?: boolean;
  planAlerts?: boolean;
  weeklyDigest?: boolean;
  pushEnabled?: boolean;
}

/**
 * Crear notificación respetando preferencias del usuario
 * @returns notification si se creó, null si el usuario tiene deshabilitado ese tipo
 */
export async function createNotification(
  data: CreateNotificationData
): Promise<INotification | null> {
  try {
    // Validar userId
    if (!mongoose.Types.ObjectId.isValid(data.userId)) {
      throw new Error('Invalid userId: must be a valid MongoDB ObjectId');
    }

    // Validar campos requeridos
    if (!data.title || data.title.trim() === '') {
      throw new Error('Title is required and cannot be empty');
    }
    if (!data.message || data.message.trim() === '') {
      throw new Error('Message is required and cannot be empty');
    }

    // Obtener preferencias del usuario
    const preferences = await getUserPreferences(data.userId);

    // Mapeo de tipo de notificación a campo de preferencia
    const preferenceMap: Record<NotificationType, keyof INotificationPreference> = {
      subscription: 'subscriptionAlerts',
      plan_alert: 'planAlerts',
      insight: 'weeklyDigest', // insights usan weeklyDigest preference
      weekly_digest: 'weeklyDigest'
    };

    const preferenceKey = preferenceMap[data.type];
    
    // Verificar si el tipo de notificación está habilitado
    if (!preferences[preferenceKey]) {
      // Usuario tiene deshabilitado este tipo de notificación
      return null;
    }

    // Crear notificación
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      read: false
    });

    await notification.save();
    return notification;
    
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
}

/**
 * Obtener notificaciones del usuario
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20
): Promise<INotification[]> {
  try {
    // Validar userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId: must be a valid MongoDB ObjectId');
    }

    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 }) // Más recientes primero
      .limit(limit);

    return notifications;
    
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
}

/**
 * Marcar notificación como leída
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<INotification | null> {
  try {
    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notificationId: must be a valid MongoDB ObjectId');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId: must be a valid MongoDB ObjectId');
    }

    // Buscar notificación que pertenezca al usuario
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!notification) {
      // No encontrada o no pertenece al usuario
      return null;
    }

    // Actualizar campo read
    notification.read = true;
    await notification.save();

    return notification;
    
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
}

/**
 * Obtener preferencias del usuario (crea defaults si no existen)
 */
export async function getUserPreferences(
  userId: string
): Promise<INotificationPreference> {
  try {
    // Validar userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId: must be a valid MongoDB ObjectId');
    }

    let preferences = await NotificationPreference.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    // Si no existen, crear con valores por defecto
    if (!preferences) {
      preferences = new NotificationPreference({
        userId: new mongoose.Types.ObjectId(userId),
        subscriptionAlerts: true,
        planAlerts: true,
        weeklyDigest: true,
        pushEnabled: false
      });
      await preferences.save();
    }

    return preferences;
    
  } catch (error) {
    console.error('Error al obtener preferencias:', error);
    throw error;
  }
}

/**
 * Actualizar preferencias del usuario
 */
export async function updateUserPreferences(
  userId: string,
  data: UpdatePreferencesData
): Promise<INotificationPreference> {
  try {
    // Validar userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId: must be a valid MongoDB ObjectId');
    }

    // Validar que los campos sean booleanos
    const booleanFields: (keyof UpdatePreferencesData)[] = [
      'subscriptionAlerts',
      'planAlerts',
      'weeklyDigest',
      'pushEnabled'
    ];

    for (const field of booleanFields) {
      if (data[field] !== undefined && typeof data[field] !== 'boolean') {
        throw new Error(`${field} must be a boolean value`);
      }
    }

    // Usar findOneAndUpdate con upsert para crear o actualizar
    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return preferences!;
    
  } catch (error) {
    console.error('Error al actualizar preferencias:', error);
    throw error;
  }
}
