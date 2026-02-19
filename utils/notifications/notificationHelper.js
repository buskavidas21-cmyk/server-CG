/**
 * Notification Helper
 * 
 * Utility functions to gather recipients for different notification events.
 * Centralizes the logic for finding who should be notified.
 * 
 * Each recipient includes notification preferences from User model:
 *   - notificationEmail (true/false)
 *   - notificationPush (true/false)
 *   - fcmToken (for mobile push)
 */

const User = require('../../models/userModel');

/**
 * Format a user document into a recipient object
 */
const formatRecipient = (user) => {
    const recipient = {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        notificationEmail: user.notifications?.email !== false, // default true
        notificationPush: user.notifications?.push !== false,   // default true
        fcmToken: user.fcmToken || null,
    };
    console.log(`📋 [HELPER] Recipient loaded: ${recipient.name} (${recipient.role}) | email: ${recipient.email} | fcmToken: ${recipient.fcmToken ? recipient.fcmToken.substring(0, 20) + '...' : 'NONE'}`);
    return recipient;
};

/**
 * Get all admin and sub_admin users (for system-wide notifications)
 * @returns {Array<object>}
 */
const getAdminRecipients = async () => {
    const admins = await User.find({ role: { $in: ['admin', 'sub_admin'] } })
        .select('name email role notifications fcmToken');
    return admins.map(formatRecipient);
};

/**
 * Get a single user as recipient by ID
 * @param {string} userId
 * @returns {object|null}
 */
const getUserRecipient = async (userId) => {
    if (!userId) return null;
    const user = await User.findById(userId)
        .select('name email role notifications fcmToken');
    if (!user) return null;
    return formatRecipient(user);
};

/**
 * Get client users assigned to a specific location
 * @param {string} locationId
 * @returns {Array<object>}
 */
const getClientRecipientsForLocation = async (locationId) => {
    if (!locationId) return [];
    const clients = await User.find({
        role: 'client',
        assignedLocations: locationId,
    }).select('name email role notifications fcmToken');
    return clients.map(formatRecipient);
};

/**
 * Combine multiple recipient arrays, removing duplicates by email
 * @param  {...Array} recipientArrays
 * @returns {Array}
 */
const mergeRecipients = (...recipientArrays) => {
    const seen = new Set();
    const merged = [];
    for (const arr of recipientArrays) {
        for (const recipient of (arr || [])) {
            if (recipient && recipient.email && !seen.has(recipient.email)) {
                seen.add(recipient.email);
                merged.push(recipient);
            }
        }
    }
    return merged;
};

module.exports = {
    getAdminRecipients,
    getUserRecipient,
    getClientRecipientsForLocation,
    mergeRecipients,
};
