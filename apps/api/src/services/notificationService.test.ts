import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';

// Mock functions creados con vi.hoisted() para evitar problemas de hoisting
const {
  mockNotificationSave,
  mockNotificationFind,
  mockNotificationFindOne,
  mockPreferenceFind,
  mockPreferenceFindOne,
  mockPreferenceFindOneAndUpdate,
  mockPreferenceSave
} = vi.hoisted(() => ({
  mockNotificationSave: vi.fn(),
  mockNotificationFind: vi.fn(),
  mockNotificationFindOne: vi.fn(),
  mockPreferenceFind: vi.fn(),
  mockPreferenceFindOne: vi.fn(),
  mockPreferenceFindOneAndUpdate: vi.fn(),
  mockPreferenceSave: vi.fn()
}));

// Mock de Notification model
vi.mock('../models/Notification', () => ({
  Notification: vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockNotificationSave
  })),
  NotificationType: {} as any
}));

// Mock de NotificationPreference model
vi.mock('../models/NotificationPreference', () => ({
  NotificationPreference: vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockPreferenceSave,
    findOne: mockPreferenceFindOne,
    findOneAndUpdate: mockPreferenceFindOneAndUpdate
  }))
}));

// Importar después de los mocks
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  getUserPreferences,
  updateUserPreferences
} from './notificationService';
import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';

// ID de usuario válido de 24 caracteres
const VALID_USER_ID = '507f1f77bcf86cd799439011';
const VALID_NOTIFICATION_ID = '507f1f77bcf86cd799439012';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification when preference is enabled', async () => {
      // Arrange
      const mockPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: true,
        planAlerts: true,
        weeklyDigest: true,
        pushEnabled: false
      };

      const mockNotification = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        type: 'subscription',
        title: 'Test Notification',
        message: 'Test message',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock getUserPreferences
      (NotificationPreference as any).findOne = vi.fn().mockResolvedValue(mockPreference);
      mockNotificationSave.mockResolvedValue(mockNotification);

      // Act
      const result = await createNotification({
        userId: VALID_USER_ID,
        type: 'subscription',
        title: 'Test Notification',
        message: 'Test message'
      });

      // Assert
      expect(result).not.toBeNull();
      expect(mockNotificationSave).toHaveBeenCalled();
    });

    it('should return null when preference is disabled', async () => {
      // Arrange
      const mockPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: false, // Deshabilitado
        planAlerts: true,
        weeklyDigest: true,
        pushEnabled: false
      };

      (NotificationPreference as any).findOne = vi.fn().mockResolvedValue(mockPreference);

      // Act
      const result = await createNotification({
        userId: VALID_USER_ID,
        type: 'subscription',
        title: 'Test Notification',
        message: 'Test message'
      });

      // Assert
      expect(result).toBeNull();
      expect(mockNotificationSave).not.toHaveBeenCalled();
    });

    it('should throw error for invalid userId', async () => {
      // Act & Assert
      await expect(
        createNotification({
          userId: 'invalid-id',
          type: 'subscription',
          title: 'Test',
          message: 'Test message'
        })
      ).rejects.toThrow('Invalid userId: must be a valid MongoDB ObjectId');
    });

    it('should throw error when title is empty', async () => {
      // Act & Assert
      await expect(
        createNotification({
          userId: VALID_USER_ID,
          type: 'subscription',
          title: '',
          message: 'Test message'
        })
      ).rejects.toThrow('Title is required and cannot be empty');
    });

    it('should throw error when message is empty', async () => {
      // Act & Assert
      await expect(
        createNotification({
          userId: VALID_USER_ID,
          type: 'subscription',
          title: 'Test',
          message: ''
        })
      ).rejects.toThrow('Message is required and cannot be empty');
    });

    it('should create default preferences if user has none', async () => {
      // Arrange
      (NotificationPreference as any).findOne = vi.fn().mockResolvedValue(null);
      
      const mockNewPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: true,
        planAlerts: true,
        weeklyDigest: true,
        pushEnabled: false
      };

      mockPreferenceSave.mockResolvedValue(mockNewPreference);
      mockNotificationSave.mockResolvedValue({});

      // Act
      await createNotification({
        userId: VALID_USER_ID,
        type: 'subscription',
        title: 'Test',
        message: 'Test message'
      });

      // Assert
      expect(mockPreferenceSave).toHaveBeenCalled();
    });

    it('should map notification types to correct preference fields', async () => {
      // Arrange
      const testCases = [
        { type: 'subscription' as const, preferenceField: 'subscriptionAlerts' },
        { type: 'plan_alert' as const, preferenceField: 'planAlerts' },
        { type: 'insight' as const, preferenceField: 'weeklyDigest' },
        { type: 'weekly_digest' as const, preferenceField: 'weeklyDigest' }
      ];

      for (const { type, preferenceField } of testCases) {
        vi.clearAllMocks();

        const mockPreference = {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(VALID_USER_ID),
          subscriptionAlerts: preferenceField === 'subscriptionAlerts',
          planAlerts: preferenceField === 'planAlerts',
          weeklyDigest: preferenceField === 'weeklyDigest',
          pushEnabled: false
        };

        (NotificationPreference as any).findOne = vi.fn().mockResolvedValue(mockPreference);
        mockNotificationSave.mockResolvedValue({});

        // Act
        const result = await createNotification({
          userId: VALID_USER_ID,
          type,
          title: 'Test',
          message: 'Test message'
        });

        // Assert
        expect(result).not.toBeNull();
      }
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications sorted by date descending', async () => {
      // Arrange
      const mockNotifications = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(VALID_USER_ID),
          type: 'subscription',
          title: 'Notification 2',
          message: 'Message 2',
          read: false,
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-03-15')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(VALID_USER_ID),
          type: 'plan_alert',
          title: 'Notification 1',
          message: 'Message 1',
          read: false,
          createdAt: new Date('2024-03-14'),
          updatedAt: new Date('2024-03-14')
        }
      ];

      (Notification as any).find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockNotifications)
        })
      });

      // Act
      const result = await getUserNotifications(VALID_USER_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect((Notification as any).find).toHaveBeenCalledWith({
        userId: expect.any(mongoose.Types.ObjectId)
      });
    });

    it('should return empty array when no notifications exist', async () => {
      // Arrange
      (Notification as any).find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      });

      // Act
      const result = await getUserNotifications(VALID_USER_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should respect custom limit parameter', async () => {
      // Arrange
      const mockLimit = vi.fn().mockResolvedValue([]);
      (Notification as any).find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: mockLimit
        })
      });

      // Act
      await getUserNotifications(VALID_USER_ID, 10);

      // Assert
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should throw error for invalid userId', async () => {
      // Act & Assert
      await expect(
        getUserNotifications('invalid-id')
      ).rejects.toThrow('Invalid userId: must be a valid MongoDB ObjectId');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      // Arrange
      const mockNotification = {
        _id: new mongoose.Types.ObjectId(VALID_NOTIFICATION_ID),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        type: 'subscription',
        title: 'Test',
        message: 'Test message',
        read: false,
        save: vi.fn().mockResolvedValue(true)
      };

      (Notification as any).findOne = vi.fn().mockResolvedValue(mockNotification);

      // Act
      const result = await markAsRead(VALID_NOTIFICATION_ID, VALID_USER_ID);

      // Assert
      expect(result).not.toBeNull();
      expect(mockNotification.read).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
    });

    it('should return null when notification not found', async () => {
      // Arrange
      (Notification as any).findOne = vi.fn().mockResolvedValue(null);

      // Act
      const result = await markAsRead(VALID_NOTIFICATION_ID, VALID_USER_ID);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when notification belongs to different user', async () => {
      // Arrange
      (Notification as any).findOne = vi.fn().mockResolvedValue(null);

      // Act
      const result = await markAsRead(VALID_NOTIFICATION_ID, '507f1f77bcf86cd799439099');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for invalid notificationId', async () => {
      // Act & Assert
      await expect(
        markAsRead('invalid-id', VALID_USER_ID)
      ).rejects.toThrow('Invalid notificationId: must be a valid MongoDB ObjectId');
    });

    it('should throw error for invalid userId', async () => {
      // Act & Assert
      await expect(
        markAsRead(VALID_NOTIFICATION_ID, 'invalid-id')
      ).rejects.toThrow('Invalid userId: must be a valid MongoDB ObjectId');
    });

    it('should be idempotent - marking already read notification', async () => {
      // Arrange
      const mockNotification = {
        _id: new mongoose.Types.ObjectId(VALID_NOTIFICATION_ID),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        type: 'subscription',
        title: 'Test',
        message: 'Test message',
        read: true, // Ya leída
        save: vi.fn().mockResolvedValue(true)
      };

      (Notification as any).findOne = vi.fn().mockResolvedValue(mockNotification);

      // Act
      const result = await markAsRead(VALID_NOTIFICATION_ID, VALID_USER_ID);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.read).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
    });
  });

  describe('getUserPreferences', () => {
    it('should return existing preferences', async () => {
      // Arrange
      const mockPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: true,
        planAlerts: false,
        weeklyDigest: true,
        pushEnabled: false
      };

      (NotificationPreference as any).findOne = vi.fn().mockResolvedValue(mockPreference);

      // Act
      const result = await getUserPreferences(VALID_USER_ID);

      // Assert
      expect(result).toEqual(mockPreference);
    });

    it('should create default preferences when none exist', async () => {
      // Arrange
      (NotificationPreference as any).findOne = vi.fn().mockResolvedValue(null);
      
      const mockNewPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: true,
        planAlerts: true,
        weeklyDigest: true,
        pushEnabled: false
      };

      mockPreferenceSave.mockResolvedValue(mockNewPreference);

      // Act
      const result = await getUserPreferences(VALID_USER_ID);

      // Assert
      expect(mockPreferenceSave).toHaveBeenCalled();
      expect(result.subscriptionAlerts).toBe(true);
      expect(result.planAlerts).toBe(true);
      expect(result.weeklyDigest).toBe(true);
      expect(result.pushEnabled).toBe(false);
    });

    it('should throw error for invalid userId', async () => {
      // Act & Assert
      await expect(
        getUserPreferences('invalid-id')
      ).rejects.toThrow('Invalid userId: must be a valid MongoDB ObjectId');
    });
  });

  describe('updateUserPreferences', () => {
    it('should update preferences successfully', async () => {
      // Arrange
      const updatedPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: false,
        planAlerts: true,
        weeklyDigest: false,
        pushEnabled: true
      };

      (NotificationPreference as any).findOneAndUpdate = vi.fn().mockResolvedValue(updatedPreference);

      // Act
      const result = await updateUserPreferences(VALID_USER_ID, {
        subscriptionAlerts: false,
        pushEnabled: true
      });

      // Assert
      expect(result).toEqual(updatedPreference);
      expect((NotificationPreference as any).findOneAndUpdate).toHaveBeenCalledWith(
        { userId: expect.any(mongoose.Types.ObjectId) },
        { $set: { subscriptionAlerts: false, pushEnabled: true } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    });

    it('should throw error for invalid userId', async () => {
      // Act & Assert
      await expect(
        updateUserPreferences('invalid-id', { subscriptionAlerts: false })
      ).rejects.toThrow('Invalid userId: must be a valid MongoDB ObjectId');
    });

    it('should throw error for non-boolean preference value', async () => {
      // Act & Assert
      await expect(
        updateUserPreferences(VALID_USER_ID, { subscriptionAlerts: 'true' as any })
      ).rejects.toThrow('subscriptionAlerts must be a boolean value');
    });

    it('should allow partial updates', async () => {
      // Arrange
      const updatedPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: true,
        planAlerts: false,
        weeklyDigest: true,
        pushEnabled: false
      };

      (NotificationPreference as any).findOneAndUpdate = vi.fn().mockResolvedValue(updatedPreference);

      // Act
      await updateUserPreferences(VALID_USER_ID, {
        planAlerts: false
      });

      // Assert
      expect((NotificationPreference as any).findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        { $set: { planAlerts: false } },
        expect.anything()
      );
    });

    it('should create preferences with upsert if they do not exist', async () => {
      // Arrange
      const newPreference = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(VALID_USER_ID),
        subscriptionAlerts: false,
        planAlerts: true,
        weeklyDigest: true,
        pushEnabled: false
      };

      (NotificationPreference as any).findOneAndUpdate = vi.fn().mockResolvedValue(newPreference);

      // Act
      const result = await updateUserPreferences(VALID_USER_ID, {
        subscriptionAlerts: false
      });

      // Assert
      expect(result).toEqual(newPreference);
      expect((NotificationPreference as any).findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ upsert: true })
      );
    });
  });
});
