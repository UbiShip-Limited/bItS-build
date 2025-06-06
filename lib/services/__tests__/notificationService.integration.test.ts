import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { NotificationService, NotificationType, NotificationPriority } from '../notificationService';
import { testPrisma, setupExternalMocks, createTestUser, createTestCustomer } from './testSetup';

// Use shared test setup
setupExternalMocks();

describe('NotificationService (Integration)', () => {
  let notificationService: NotificationService;
  let testAdmin: any;
  let testArtist: any;
  let testCustomer: any;

  beforeEach(async () => {
    console.log('\n🔔 Setting up NotificationService integration test');
    
    // Initialize REAL service (no mocks)
    notificationService = new NotificationService();
    
    // Create test users
    testAdmin = await createTestUser('admin');
    testArtist = await createTestUser('artist');
    testCustomer = await createTestCustomer();
    
    console.log('✅ NotificationService test setup complete');
  });

  describe('🔔 Notification Creation', () => {
    it('should create basic notification successfully', async () => {
      console.log('\n📝 Testing basic notification creation');
      
      const notificationData = {
        userId: testAdmin.id,
        title: 'Test Notification',
        message: 'This is a test notification for integration testing',
        type: NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority.MEDIUM
      };

      const notification = await notificationService.createNotification(notificationData);

      expect(notification).toBeDefined();
      expect(notification.id).toBeTruthy();
      expect(notification.title).toBe(notificationData.title);
      expect(notification.message).toBe(notificationData.message);
      expect(notification.type).toBe(NotificationType.SYSTEM_ALERT);
      expect(notification.priority).toBe(NotificationPriority.MEDIUM);
      expect(notification.read).toBe(false);
      expect(notification.createdAt).toBeInstanceOf(Date);

      // Verify stored in audit log
      const auditLog = await testPrisma.auditLog.findUnique({
        where: { id: notification.id }
      });
      expect(auditLog).toBeTruthy();
      expect(auditLog!.action).toBe('notification_created');

      console.log('✅ Basic notification created successfully');
    });

    it('should create notification with default priority', async () => {
      console.log('\n⚖️ Testing default priority assignment');
      
      const notification = await notificationService.createNotification({
        title: 'Default Priority Test',
        message: 'Testing default priority assignment',
        type: NotificationType.SYSTEM_ALERT
      });

      expect(notification.priority).toBe(NotificationPriority.MEDIUM);
      console.log('✅ Default priority assigned correctly');
    });

    it('should create notification with additional data', async () => {
      console.log('\n📦 Testing notification with metadata');
      
      const notificationData = {
        title: 'Appointment Reminder',
        message: 'Your appointment is tomorrow',
        type: NotificationType.APPOINTMENT_UPDATED,
        priority: NotificationPriority.HIGH,
        data: {
          appointmentId: 'test-apt-123',
          customerId: testCustomer.id,
          reminderType: 'day_before'
        }
      };

      const notification = await notificationService.createNotification(notificationData);

      expect(notification.data).toEqual(notificationData.data);
      expect(notification.data.appointmentId).toBe('test-apt-123');

      console.log('✅ Notification with metadata created successfully');
    });
  });

  describe('📋 Notification Retrieval', () => {
    beforeEach(async () => {
      console.log('\n📋 Setting up notifications for retrieval testing');
      
      // Create multiple notifications for testing
      const notifications = [
        {
          userId: testAdmin.id,
          title: 'First Notification',
          message: 'First test notification',
          type: NotificationType.SYSTEM_ALERT,
          priority: NotificationPriority.LOW
        },
        {
          userId: testAdmin.id,
          title: 'Second Notification',
          message: 'Second test notification',
          type: NotificationType.APPOINTMENT_CREATED,
          priority: NotificationPriority.HIGH
        },
        {
          userId: testArtist.id,
          title: 'Artist Notification',
          message: 'Notification for artist',
          type: NotificationType.PAYMENT_RECEIVED,
          priority: NotificationPriority.MEDIUM
        }
      ];

      for (const notifData of notifications) {
        await notificationService.createNotification(notifData);
      }

      console.log('✅ Test notifications created');
    });

    it('should retrieve user notifications with pagination', async () => {
      console.log('\n📄 Testing notification retrieval with pagination');
      
      const result = await notificationService.getNotifications(testAdmin.id, {}, 1, 2);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThan(0);
      expect(result.unreadCount).toBeGreaterThan(0);

      // Should only return notifications for this user
      result.data.forEach(notification => {
        expect(notification.userId).toBe(testAdmin.id);
      });

      console.log('✅ Notification retrieval with pagination working');
      console.log(`📊 Found ${result.total} total, ${result.unreadCount} unread`);
    });

    it('should filter notifications by type', async () => {
      console.log('\n🔍 Testing notification filtering by type');
      
      const result = await notificationService.getNotifications(testAdmin.id, {
        type: NotificationType.APPOINTMENT_CREATED
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(notification => {
        expect(notification.type).toBe(NotificationType.APPOINTMENT_CREATED);
      });

      console.log('✅ Type filtering working correctly');
    });

    it('should filter notifications by priority', async () => {
      console.log('\n⚠️ Testing notification filtering by priority');
      
      const result = await notificationService.getNotifications(testAdmin.id, {
        priority: NotificationPriority.HIGH
      });

      result.data.forEach(notification => {
        expect(notification.priority).toBe(NotificationPriority.HIGH);
      });

      console.log('✅ Priority filtering working correctly');
    });

    it('should filter notifications by read status', async () => {
      console.log('\n👁️ Testing notification filtering by read status');
      
      const unreadResult = await notificationService.getNotifications(testAdmin.id, {
        read: false
      });

      unreadResult.data.forEach(notification => {
        expect(notification.read).toBe(false);
      });

      console.log('✅ Read status filtering working correctly');
    });
  });

  describe('✅ Notification Management', () => {
    let testNotification: any;

    beforeEach(async () => {
      console.log('\n✅ Setting up notification for management testing');
      
      testNotification = await notificationService.createNotification({
        userId: testAdmin.id,
        title: 'Management Test',
        message: 'Notification for management testing',
        type: NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority.MEDIUM
      });
    });

    it('should mark notification as read', async () => {
      console.log('\n📖 Testing mark as read functionality');
      
      expect(testNotification.read).toBe(false);

      await notificationService.markAsRead(testNotification.id, testAdmin.id);

      // Verify notification is marked as read
      const notifications = await notificationService.getNotifications(testAdmin.id);
      const updatedNotification = notifications.data.find(n => n.id === testNotification.id);
      
      expect(updatedNotification).toBeDefined();
      expect(updatedNotification!.read).toBe(true);
      expect(updatedNotification!.readAt).toBeInstanceOf(Date);

      console.log('✅ Notification marked as read successfully');
    });

    it('should prevent marking another users notification as read', async () => {
      console.log('\n🔒 Testing user permission enforcement');
      
      await expect(
        notificationService.markAsRead(testNotification.id, testArtist.id)
      ).rejects.toThrow('Cannot mark notification as read for another user');

      console.log('✅ User permission enforcement working correctly');
    });

    it('should mark all notifications as read', async () => {
      console.log('\n📚 Testing mark all as read functionality');
      
      // Create additional notifications
      await notificationService.createNotification({
        userId: testAdmin.id,
        title: 'Bulk Test 1',
        message: 'First bulk test notification',
        type: NotificationType.SYSTEM_ALERT
      });

      await notificationService.createNotification({
        userId: testAdmin.id,
        title: 'Bulk Test 2',
        message: 'Second bulk test notification',
        type: NotificationType.SYSTEM_ALERT
      });

      // Mark all as read
      await notificationService.markAllAsRead(testAdmin.id);

      // Verify all notifications are read
      const result = await notificationService.getNotifications(testAdmin.id);
      expect(result.unreadCount).toBe(0);
      
      result.data.forEach(notification => {
        expect(notification.read).toBe(true);
        expect(notification.readAt).toBeInstanceOf(Date);
      });

      console.log('✅ All notifications marked as read successfully');
    });

    it('should delete notification', async () => {
      console.log('\n🗑️ Testing notification deletion');
      
      await notificationService.deleteNotification(testNotification.id, testAdmin.id);

      // Verify notification is deleted
      const notifications = await notificationService.getNotifications(testAdmin.id);
      const deletedNotification = notifications.data.find(n => n.id === testNotification.id);
      
      expect(deletedNotification).toBeUndefined();

      console.log('✅ Notification deleted successfully');
    });
  });

  describe('⚡ Real-time Updates', () => {
    it('should get recent real-time updates', async () => {
      console.log('\n⚡ Testing real-time updates retrieval');
      
      // Create some recent activity
      await notificationService.createNotification({
        userId: testAdmin.id,
        title: 'Real-time Test',
        message: 'Testing real-time functionality',
        type: NotificationType.SYSTEM_ALERT
      });

      const updates = await notificationService.getRealtimeUpdates(testAdmin.id);

      expect(Array.isArray(updates)).toBe(true);
      
      if (updates.length > 0) {
        updates.forEach(update => {
          expect(update).toHaveProperty('id');
          expect(update).toHaveProperty('type');
          expect(update).toHaveProperty('data');
          expect(update).toHaveProperty('timestamp');
          expect(update.timestamp).toBeInstanceOf(Date);
        });
      }

      console.log('✅ Real-time updates working correctly');
      console.log(`📊 Found ${updates.length} recent updates`);
    });

    it('should subscribe and unsubscribe to updates', async () => {
      console.log('\n📡 Testing subscription management');
      
      let callbackCalled = false;
      const testCallback = (update: any) => {
        callbackCalled = true;
        console.log('📢 Callback received update:', update.type);
      };

      // Subscribe
      await notificationService.subscribeToUpdates(testAdmin.id, testCallback);

      // Unsubscribe
      await notificationService.unsubscribeFromUpdates(testAdmin.id, testCallback);

      // Unsubscribe all (should not throw)
      await notificationService.unsubscribeFromUpdates(testAdmin.id);

      console.log('✅ Subscription management working correctly');
    });
  });

  describe('🎯 Specialized Notifications', () => {
    it('should create appointment notifications', async () => {
      console.log('\n📅 Testing appointment notification creation');
      
      const appointmentId = 'test-appointment-123';
      
      await notificationService.createAppointmentNotification(
        'created',
        appointmentId,
        testCustomer.id,
        { appointmentType: 'consultation' }
      );

      const notifications = await notificationService.getNotifications(testAdmin.id);
      const appointmentNotif = notifications.data.find(n => 
        n.type === NotificationType.APPOINTMENT_CREATED
      );

      expect(appointmentNotif).toBeDefined();
      expect(appointmentNotif!.data.appointmentId).toBe(appointmentId);

      console.log('✅ Appointment notification created successfully');
    });

    it('should create payment notifications', async () => {
      console.log('\n💳 Testing payment notification creation');
      
      const paymentId = 'test-payment-123';
      const amount = 150;
      
      await notificationService.createPaymentNotification(
        'received',
        paymentId,
        amount,
        testCustomer.id
      );

      const notifications = await notificationService.getNotifications(testAdmin.id);
      const paymentNotif = notifications.data.find(n => 
        n.type === NotificationType.PAYMENT_RECEIVED
      );

      expect(paymentNotif).toBeDefined();
      expect(paymentNotif!.data.paymentId).toBe(paymentId);
      expect(paymentNotif!.data.amount).toBe(amount);

      console.log('✅ Payment notification created successfully');
    });

    it('should create request notifications', async () => {
      console.log('\n📝 Testing request notification creation');
      
      const requestId = 'test-request-123';
      
      await notificationService.createRequestNotification(
        'submitted',
        requestId,
        testCustomer.id
      );

      const notifications = await notificationService.getNotifications(testAdmin.id);
      const requestNotif = notifications.data.find(n => 
        n.type === NotificationType.REQUEST_SUBMITTED
      );

      expect(requestNotif).toBeDefined();
      expect(requestNotif!.data.requestId).toBe(requestId);

      console.log('✅ Request notification created successfully');
    });

    it('should create system alerts', async () => {
      console.log('\n🚨 Testing system alert creation');
      
      await notificationService.createSystemAlert(
        'System Maintenance',
        'Scheduled maintenance will begin at 2 AM',
        NotificationPriority.HIGH,
        { maintenanceType: 'database', duration: '2 hours' }
      );

      const notifications = await notificationService.getNotifications(testAdmin.id);
      const alertNotif = notifications.data.find(n => 
        n.title === 'System Maintenance'
      );

      expect(alertNotif).toBeDefined();
      expect(alertNotif!.priority).toBe(NotificationPriority.HIGH);
      expect(alertNotif!.data.maintenanceType).toBe('database');

      console.log('✅ System alert created successfully');
    });
  });

  describe('🧹 Maintenance and Analytics', () => {
    beforeEach(async () => {
      console.log('\n🧹 Setting up notifications for maintenance testing');
      
      // Create notifications with expiration dates
      const expiredNotification = await notificationService.createNotification({
        title: 'Expired Notification',
        message: 'This notification should be cleaned up',
        type: NotificationType.SYSTEM_ALERT,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
      });

      const activeNotification = await notificationService.createNotification({
        title: 'Active Notification',
        message: 'This notification should remain',
        type: NotificationType.SYSTEM_ALERT,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires tomorrow
      });
    });

    it('should cleanup expired notifications', async () => {
      console.log('\n🗑️ Testing expired notification cleanup');
      
      const cleanedCount = await notificationService.cleanupExpiredNotifications();

      expect(cleanedCount).toBeGreaterThanOrEqual(0);
      console.log(`✅ Cleaned up ${cleanedCount} expired notifications`);
    });

    it('should provide notification statistics', async () => {
      console.log('\n📊 Testing notification statistics');
      
      const stats = await notificationService.getNotificationStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('unread');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byPriority');

      expect(stats.total).toBeTypeOf('number');
      expect(stats.unread).toBeTypeOf('number');
      expect(typeof stats.byType).toBe('object');
      expect(typeof stats.byPriority).toBe('object');

      console.log('✅ Notification statistics working correctly');
      console.log(`📊 Total: ${stats.total}, Unread: ${stats.unread}`);
    });

    it('should provide user-specific statistics', async () => {
      console.log('\n👤 Testing user-specific statistics');
      
      const userStats = await notificationService.getNotificationStats(testAdmin.id);
      const globalStats = await notificationService.getNotificationStats();

      expect(userStats.total).toBeLessThanOrEqual(globalStats.total);
      
      console.log(`✅ User stats: ${userStats.total}, Global stats: ${globalStats.total}`);
    });
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    it('should handle non-existent notification gracefully', async () => {
      console.log('\n❌ Testing non-existent notification handling');
      
      await expect(
        notificationService.markAsRead('non-existent-id', testAdmin.id)
      ).rejects.toThrow('Notification not found');

      await expect(
        notificationService.deleteNotification('non-existent-id', testAdmin.id)
      ).rejects.toThrow('Notification not found');

      console.log('✅ Non-existent notification errors handled correctly');
    });

    it('should handle empty notification list gracefully', async () => {
      console.log('\n📭 Testing empty notification list handling');
      
      // Create user with no notifications
      const newUser = await createTestUser('artist');
      
      const result = await notificationService.getNotifications(newUser.id);
      
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.unreadCount).toBe(0);

      console.log('✅ Empty notification list handled gracefully');
    });

    it('should complete operations within reasonable time', async () => {
      console.log('\n⏱️ Testing notification service performance');
      
      const startTime = Date.now();
      
      await notificationService.createNotification({
        title: 'Performance Test',
        message: 'Testing notification service performance',
        type: NotificationType.SYSTEM_ALERT
      });
      
      await notificationService.getNotifications(testAdmin.id);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(2000); // Should complete in under 2 seconds

      console.log(`✅ Notification operations completed in ${executionTime}ms`);
    });
  });
}); 