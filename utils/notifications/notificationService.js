/**
 * Notification Service - Central Orchestrator
 * 
 * This service manages all notification channels (email, push, etc.)
 * and routes notifications to the appropriate channels based on event type.
 * 
 * Architecture:
 *   notificationService.notify(EVENT, recipients, data)
 *       → emailChannel.send(...)
 *       → pushChannel.send(...)  (when Firebase is added)
 * 
 * To add a new channel (e.g., Firebase Push):
 *   1. Create the channel in channels/pushChannel.js
 *   2. Register it: notificationService.registerChannel('push', pushChannel)
 *   3. Add 'push' to desired events in notificationTypes.js
 */

const NOTIFICATION_EVENTS = require('./notificationTypes');

class NotificationService {
    constructor() {
        this.channels = new Map(); // channelName → channelInstance
        this.enabled = process.env.NOTIFICATIONS_ENABLED !== 'false'; // Enabled by default
    }

    /**
     * Register a notification channel
     * @param {string} name - Channel identifier (e.g., 'email', 'push')
     * @param {object} channel - Channel instance with send() method
     */
    registerChannel(name, channel) {
        if (typeof channel.send !== 'function') {
            throw new Error(`Channel "${name}" must implement a send() method`);
        }
        this.channels.set(name, channel);
        console.log(`📢 Notification channel registered: ${name}`);
    }

    /**
     * Remove a notification channel
     * @param {string} name - Channel identifier
     */
    removeChannel(name) {
        this.channels.delete(name);
        console.log(`📢 Notification channel removed: ${name}`);
    }

    /**
     * Send a notification through all applicable channels
     * @param {string} eventKey - Event key from NOTIFICATION_EVENTS (e.g., 'TICKET_ASSIGNED')
     * @param {object} payload - Notification payload
     * @param {Array<object>} payload.recipients - Array of { userId, email, name, role, fcmToken? }
     * @param {object} payload.data - Event-specific data
     * @param {object} [payload.meta] - Optional metadata (triggeredBy, etc.)
     * @returns {object} Results from each channel
     */
    async notify(eventKey, payload) {
        if (!this.enabled) {
            return { skipped: true, reason: 'Notifications disabled' };
        }

        const event = NOTIFICATION_EVENTS[eventKey];
        if (!event) {
            console.warn(`⚠️ Unknown notification event: ${eventKey}`);
            return { error: `Unknown event: ${eventKey}` };
        }

        const { recipients = [], data = {}, meta = {} } = payload;

        if (recipients.length === 0) {
            return { skipped: true, reason: 'No recipients' };
        }

        const results = {};

        console.log(`\n🔔 ─── Notification: ${eventKey} ───`);
        console.log(`   Channels: [${event.channels.join(', ')}] | Recipients: ${recipients.length}`);

        // Send through each channel that the event supports
        for (const channelName of event.channels) {
            const channel = this.channels.get(channelName);

            if (!channel) {
                console.log(`   ⏭️ [${channelName}] — channel not registered, skipping`);
                results[channelName] = { skipped: true, reason: 'Channel not registered' };
                continue;
            }

            try {
                console.log(`   ▶️ [${channelName}] — dispatching...`);
                const result = await channel.send({
                    event,
                    recipients,
                    data,
                    meta,
                });
                results[channelName] = { success: true, result };
                console.log(`   ✅ [${channelName}] — done`, JSON.stringify(result).substring(0, 150));
            } catch (error) {
                console.error(`   ❌ [${channelName}] — error:`, error.message);
                results[channelName] = { success: false, error: error.message };
            }
        }

        console.log(`🔔 ─── End: ${eventKey} ───\n`);
        return results;
    }

    /**
     * Get list of registered channels
     */
    getRegisteredChannels() {
        return Array.from(this.channels.keys());
    }

    /**
     * Check if a specific channel is registered
     */
    hasChannel(name) {
        return this.channels.has(name);
    }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
