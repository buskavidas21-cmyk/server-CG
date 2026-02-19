/**
 * Notification System Initialization
 * 
 * Call this once at server startup to register all channels.
 * To add Firebase push notifications later, just uncomment the push section.
 */

const notificationService = require('./notificationService');
const emailChannel = require('./channels/emailChannel');
const pushChannel = require('./channels/pushChannel');

const initializeNotifications = () => {
    // ─── Register Email Channel ─────────────────────────────────
    emailChannel.initialize();
    notificationService.registerChannel('email', emailChannel);

    // ─── Register Push Channel (Firebase) ───────────────────────
    pushChannel.initialize();
    notificationService.registerChannel('push', pushChannel);

    console.log(`📢 Notification system initialized with channels: [${notificationService.getRegisteredChannels().join(', ')}]`);
};

module.exports = initializeNotifications;
