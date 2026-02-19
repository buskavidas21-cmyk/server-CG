/**
 * Notification Event Types
 * 
 * Central registry of all notification events in the system.
 * Each event defines which channels it supports and default settings.
 * When adding Firebase push notifications, just add 'push' to the channels array.
 */

const NOTIFICATION_EVENTS = {
    // ─── Ticket Events ───────────────────────────────────────────
    TICKET_CREATED: {
        key: 'TICKET_CREATED',
        title: 'New Ticket Created',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    TICKET_ASSIGNED: {
        key: 'TICKET_ASSIGNED',
        title: 'Ticket Assigned to You',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    TICKET_SCHEDULED: {
        key: 'TICKET_SCHEDULED',
        title: 'Ticket Scheduled',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    TICKET_STATUS_CHANGED: {
        key: 'TICKET_STATUS_CHANGED',
        title: 'Ticket Status Updated',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    TICKET_RESOLVED: {
        key: 'TICKET_RESOLVED',
        title: 'Ticket Resolved',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    TICKET_URGENT: {
        key: 'TICKET_URGENT',
        title: '🚨 Urgent Ticket Created',
        channels: ['email', 'push'],
        priority: 'high',
    },

    // ─── Inspection Events ───────────────────────────────────────
    INSPECTION_ASSIGNED: {
        key: 'INSPECTION_ASSIGNED',
        title: 'Inspection Assigned to You',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    INSPECTION_SCHEDULED: {
        key: 'INSPECTION_SCHEDULED',
        title: 'Inspection Scheduled',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    INSPECTION_COMPLETED: {
        key: 'INSPECTION_COMPLETED',
        title: 'Inspection Completed',
        channels: ['email', 'push'],
        priority: 'normal',
    },
    INSPECTION_DEFICIENT: {
        key: 'INSPECTION_DEFICIENT',
        title: '⚠️ Deficient Inspection Alert',
        channels: ['email', 'push'],
        priority: 'high',
    },

    // ─── User Events ────────────────────────────────────────────
    USER_WELCOME: {
        key: 'USER_WELCOME',
        title: 'Welcome to CleanGuard QC',
        channels: ['email'],  // No push for welcome (user has no token yet)
        priority: 'normal',
    },
    USER_UPDATED: {
        key: 'USER_UPDATED',
        title: 'Account Updated',
        channels: ['email'],  // Email only for account updates
        priority: 'normal',
    },

    // ─── Bulk Events ────────────────────────────────────────────
    BULK_TICKETS_CREATED: {
        key: 'BULK_TICKETS_CREATED',
        title: 'Bulk Tickets Created from Inspection',
        channels: ['email', 'push'],
        priority: 'normal',
    },
};

module.exports = NOTIFICATION_EVENTS;
