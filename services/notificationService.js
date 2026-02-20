const admin = require('firebase-admin');
const webpush = require('web-push');

// Initialize Firebase Admin using environment variables
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
  universe_domain: 'googleapis.com'
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Configure Web Push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class NotificationService {
  // Send notification to mobile (Android/iOS)
  async sendMobileNotification(fcmToken, notification) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('Mobile notification sent:', response);
      return response;
    } catch (error) {
      console.error('Error sending mobile notification:', error);
      throw error;
    }
  }

  // Send notification to web (Desktop)
  async sendWebNotification(subscription, notification) {
    try {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/icon-96x96.png',
        image: notification.image,
        data: notification.data || {},
        actions: notification.actions || []
      });

      const response = await webpush.sendNotification(subscription, payload);
      console.log('Web notification sent:', response.statusCode);
      return response;
    } catch (error) {
      console.error('Error sending web notification:', error);
      throw error;
    }
  }

  // Send to all user devices
  async sendToUser(userId, notification) {
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const results = [];

    // Send to mobile devices
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      for (const token of user.fcmTokens) {
        try {
          const result = await this.sendMobileNotification(token, notification);
          results.push({ platform: 'mobile', success: true, result });
        } catch (error) {
          results.push({ platform: 'mobile', success: false, error: error.message });
        }
      }
    }

    // Send to web devices
    if (user.webPushSubscriptions && user.webPushSubscriptions.length > 0) {
      for (const subscription of user.webPushSubscriptions) {
        try {
          const result = await this.sendWebNotification(subscription, notification);
          results.push({ platform: 'web', success: true, result });
        } catch (error) {
          results.push({ platform: 'web', success: false, error: error.message });
        }
      }
    }

    return results;
  }
}

module.exports = new NotificationService();
