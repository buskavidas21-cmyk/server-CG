/**
 * Push Notification Channel (Firebase Cloud Messaging - HTTP v1 API)
 *
 * Sends push notifications via FCM using google-auth-library + axios.
 *
 * Required ENV variables:
 *   FCM_SERVICE_ACCOUNT         - Full Firebase service account JSON
 *   PUSH_NOTIFICATIONS_ENABLED  - "true" to enable
 */

const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const User = require('../../../models/userModel');

const PUSH_MESSAGES = {
    TICKET_ASSIGNED: (data) => ({
        title: 'New Ticket Assigned',
        body: `You've been assigned: ${data.ticket?.title || 'New ticket'}`,
        data: { type: 'TICKET_ASSIGNED', ticketId: data.ticket?._id?.toString() || '' },
    }),
    TICKET_SCHEDULED: (data) => ({
        title: 'Ticket Scheduled',
        body: `Ticket "${data.ticket?.title}" scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}`,
        data: { type: 'TICKET_SCHEDULED', ticketId: data.ticket?._id?.toString() || '' },
    }),
    TICKET_CREATED: (data) => ({
        title: 'New Ticket Created',
        body: `New ticket: ${data.ticket?.title || 'New ticket'}`,
        data: { type: 'TICKET_CREATED', ticketId: data.ticket?._id?.toString() || '' },
    }),
    TICKET_RESOLVED: (data) => ({
        title: 'Ticket Resolved',
        body: `Ticket "${data.ticket?.title}" has been resolved`,
        data: { type: 'TICKET_RESOLVED', ticketId: data.ticket?._id?.toString() || '' },
    }),
    TICKET_STATUS_CHANGED: (data) => ({
        title: 'Ticket Updated',
        body: `Ticket "${data.ticket?.title}" → ${data.newStatus?.replace('_', ' ')}`,
        data: { type: 'TICKET_STATUS_CHANGED', ticketId: data.ticket?._id?.toString() || '' },
    }),
    TICKET_URGENT: (data) => ({
        title: 'URGENT Ticket!',
        body: `Urgent: ${data.ticket?.title || 'Immediate attention required'}`,
        data: { type: 'TICKET_URGENT', ticketId: data.ticket?._id?.toString() || '' },
    }),
    INSPECTION_ASSIGNED: (data) => ({
        title: 'Inspection Assigned',
        body: `New inspection at ${data.inspection?.locationName || 'a location'}`,
        data: { type: 'INSPECTION_ASSIGNED', inspectionId: data.inspection?._id?.toString() || '' },
    }),
    INSPECTION_SCHEDULED: (data) => ({
        title: 'Inspection Scheduled',
        body: `Inspection at ${data.inspection?.locationName} scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}`,
        data: { type: 'INSPECTION_SCHEDULED', inspectionId: data.inspection?._id?.toString() || '' },
    }),
    INSPECTION_COMPLETED: (data) => ({
        title: 'Inspection Completed',
        body: `Inspection at ${data.inspection?.locationName} — Score: ${data.inspection?.totalScore}%`,
        data: { type: 'INSPECTION_COMPLETED', inspectionId: data.inspection?._id?.toString() || '' },
    }),
    INSPECTION_DEFICIENT: (data) => ({
        title: 'Deficient Inspection!',
        body: `Low score (${data.inspection?.totalScore}%) at ${data.inspection?.locationName}`,
        data: { type: 'INSPECTION_DEFICIENT', inspectionId: data.inspection?._id?.toString() || '' },
    }),
    BULK_TICKETS_CREATED: (data) => ({
        title: 'Bulk Tickets Created',
        body: `${data.count} tickets created from inspection at ${data.locationName}`,
        data: { type: 'BULK_TICKETS_CREATED' },
    }),
};

class PushChannel {
    constructor() {
        this.enabled = false;
        this.auth = null;
        this.projectId = null;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        const enabled = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';

        if (!enabled) {
            console.log('📱 Push channel: PUSH_NOTIFICATIONS_ENABLED is not true — Push disabled.');
            this.initialized = true;
            return;
        }

        const fcmJson = process.env.FCM_SERVICE_ACCOUNT;
        if (!fcmJson) {
            console.warn('⚠️ Push channel: FCM_SERVICE_ACCOUNT env variable not found — Push disabled.');
            this.initialized = true;
            return;
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(fcmJson);
        } catch (err) {
            console.error('❌ Push channel: Failed to parse FCM_SERVICE_ACCOUNT JSON —', err.message);
            this.initialized = true;
            return;
        }

        const { project_id, client_email, private_key } = serviceAccount;
        if (!project_id || !client_email || !private_key) {
            console.warn('⚠️ Push channel: FCM_SERVICE_ACCOUNT missing project_id, client_email, or private_key — Push disabled.');
            this.initialized = true;
            return;
        }

        this.projectId = project_id;

        this.auth = new GoogleAuth({
            credentials: {
                client_email,
                private_key: private_key.replace(/\\n/g, '\n'),
            },
            scopes: [
                'https://www.googleapis.com/auth/firebase.messaging',
            ],
        });

        this.enabled = true;
        this.initialized = true;
        console.log(`✅ FCM_SERVICE_ACCOUNT loaded (Project: ${project_id} | Email: ${client_email})`);
    }

    async getAccessToken() {
        const client = await this.auth.getClient();
        const tokenResponse = await client.getAccessToken();
        return tokenResponse.token;
    }

    async send({ event, recipients, data, meta }) {
        if (!this.initialized) {
            this.initialize();
        }

        if (!this.enabled) {
            console.log(`📱 [PUSH] Skipped "${event.key}" — push not enabled`);
            return { skipped: true, reason: 'Push notifications not enabled' };
        }

        const messageFn = PUSH_MESSAGES[event.key];
        if (!messageFn) {
            console.log(`📱 [PUSH] Skipped "${event.key}" — no push template`);
            return { skipped: true, reason: `No push message template for: ${event.key}` };
        }

        const { title, body, data: pushData } = messageFn(data);

        console.log(`📱 [PUSH] Event: "${event.key}" | Total recipients: ${recipients.length}`);
        recipients.forEach((r, i) => {
            console.log(`   └─ Recipient ${i + 1}: ${r.name || r.email} | fcmToken: ${r.fcmToken ? r.fcmToken.substring(0, 20) + '...' : 'NONE'} | pushEnabled: ${r.notificationPush !== false}`);
        });

        const pushRecipients = recipients.filter(r => r.fcmToken && r.notificationPush !== false);
        if (pushRecipients.length === 0) {
            console.log(`📱 [PUSH] Skipped "${event.key}" — no recipients with FCM tokens`);
            return { skipped: true, reason: 'No recipients with FCM tokens' };
        }

        console.log(`📱 [PUSH] Sending to ${pushRecipients.length} recipient(s)...`);

        let accessToken;
        try {
            accessToken = await this.getAccessToken();
        } catch (tokenErr) {
            console.error(`❌ [PUSH] Failed to get access token:`, tokenErr.message);
            return { sent: 0, failed: pushRecipients.length, details: [{ error: 'Access token failed: ' + tokenErr.message }] };
        }

        const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
        const results = [];

        for (const recipient of pushRecipients) {
            try {
                const payload = {
                    message: {
                        token: recipient.fcmToken,
                        notification: { title, body },
                        data: pushData || {},
                        android: {
                            priority: event.priority === 'high' ? 'high' : 'normal',
                            notification: {
                                channel_id: event.priority === 'high' ? 'urgent' : 'default',
                                sound: event.priority === 'high' ? 'alarm' : 'default',
                            },
                        },
                        apns: {
                            payload: {
                                aps: {
                                    sound: event.priority === 'high' ? 'alarm.wav' : 'default',
                                    badge: 1,
                                },
                            },
                        },
                    },
                };

                const response = await axios.post(url, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                console.log(`📱 Push sent to user ${recipient.userId}: ${title}`);
                results.push({
                    userId: recipient.userId,
                    success: true,
                    messageId: response.data?.name,
                });
            } catch (error) {
                const errMsg = error.response?.data?.error?.message || error.message;
                const errCode = error.response?.data?.error?.details?.[0]?.errorCode || '';
                console.error(`❌ Push failed for user ${recipient.userId}:`, errMsg);

                results.push({
                    userId: recipient.userId,
                    success: false,
                    error: errMsg,
                });

                if (
                    errCode === 'UNREGISTERED' ||
                    errMsg.includes('not a valid FCM registration token') ||
                    errMsg.includes('Requested entity was not found')
                ) {
                    try {
                        await User.findByIdAndUpdate(recipient.userId, { fcmToken: null });
                        console.log(`🗑️ Cleared invalid FCM token for user ${recipient.userId}`);
                    } catch (dbErr) {
                        console.error(`Failed to clear FCM token for ${recipient.userId}:`, dbErr.message);
                    }
                }
            }
        }

        return {
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            details: results,
        };
    }

    async verify() {
        if (!this.initialized) this.initialize();
        if (!this.enabled) return { connected: false, reason: 'Push not enabled' };

        try {
            const token = await this.getAccessToken();
            return { connected: !!token };
        } catch (error) {
            return { connected: false, reason: error.message };
        }
    }
}

module.exports = new PushChannel();
