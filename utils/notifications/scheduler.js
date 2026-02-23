/**
 * Notification Scheduler
 *
 * Runs daily cron jobs to send reminder and overdue notifications.
 *
 * Schedule (Pacific Time — America/Los_Angeles):
 *   8:00 AM  — "Today" reminders for tickets/inspections scheduled today
 *              + Overdue alerts for past-due tickets
 *   8:00 AM  — "Tomorrow" reminders for tickets/inspections scheduled tomorrow
 *
 * Both jobs run at 8 AM PT but query different date ranges.
 */

const cron = require('node-cron');
const Ticket = require('../../models/ticketModel');
const Inspection = require('../../models/inspectionModel');
const notificationService = require('./notificationService');
const { getAdminRecipients, getUserRecipient, mergeRecipients } = require('./notificationHelper');

const TIMEZONE = 'America/Los_Angeles';

/**
 * Get start and end of a day in UTC for querying MongoDB
 */
const getDayBounds = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

/**
 * Get "today" and "tomorrow" in Pacific Time
 */
const getPacificDates = () => {
    const now = new Date();
    const pacificNow = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));

    const today = new Date(pacificNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return { today, tomorrow };
};

/**
 * Send reminders for tickets scheduled today
 */
const sendTicketTodayReminders = async () => {
    try {
        const { today } = getPacificDates();
        const { start, end } = getDayBounds(today);

        const tickets = await Ticket.find({
            scheduledDate: { $gte: start, $lte: end },
            status: { $in: ['open', 'in_progress'] },
            assignedTo: { $ne: null },
        })
            .populate('location', 'name')
            .populate('assignedTo', 'name email');

        console.log(`⏰ [SCHEDULER] Ticket TODAY reminders: ${tickets.length} found`);

        for (const ticket of tickets) {
            const recipient = await getUserRecipient(ticket.assignedTo?._id);
            if (!recipient) continue;

            await notificationService.notify('TICKET_REMINDER_TODAY', {
                recipients: [recipient],
                data: {
                    ticket: {
                        _id: ticket._id,
                        title: ticket.title,
                        priority: ticket.priority,
                        status: ticket.status,
                        locationName: ticket.location?.name || 'N/A',
                        scheduledDate: ticket.scheduledDate,
                    },
                },
            });
        }
    } catch (err) {
        console.error('❌ [SCHEDULER] Ticket today reminders failed:', err.message);
    }
};

/**
 * Send reminders for tickets scheduled tomorrow
 */
const sendTicketTomorrowReminders = async () => {
    try {
        const { tomorrow } = getPacificDates();
        const { start, end } = getDayBounds(tomorrow);

        const tickets = await Ticket.find({
            scheduledDate: { $gte: start, $lte: end },
            status: { $in: ['open', 'in_progress'] },
            assignedTo: { $ne: null },
        })
            .populate('location', 'name')
            .populate('assignedTo', 'name email');

        console.log(`⏰ [SCHEDULER] Ticket TOMORROW reminders: ${tickets.length} found`);

        for (const ticket of tickets) {
            const recipient = await getUserRecipient(ticket.assignedTo?._id);
            if (!recipient) continue;

            await notificationService.notify('TICKET_REMINDER_TOMORROW', {
                recipients: [recipient],
                data: {
                    ticket: {
                        _id: ticket._id,
                        title: ticket.title,
                        priority: ticket.priority,
                        locationName: ticket.location?.name || 'N/A',
                        scheduledDate: ticket.scheduledDate,
                    },
                },
            });
        }
    } catch (err) {
        console.error('❌ [SCHEDULER] Ticket tomorrow reminders failed:', err.message);
    }
};

/**
 * Send overdue alerts for tickets past their due date
 */
const sendTicketOverdueAlerts = async () => {
    try {
        const { today } = getPacificDates();
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);

        const tickets = await Ticket.find({
            dueDate: { $lt: todayStart },
            status: { $in: ['open', 'in_progress'] },
        })
            .populate('location', 'name')
            .populate('assignedTo', 'name email');

        console.log(`⏰ [SCHEDULER] Overdue tickets: ${tickets.length} found`);

        for (const ticket of tickets) {
            const daysOverdue = Math.ceil((todayStart - new Date(ticket.dueDate)) / (1000 * 60 * 60 * 24));

            const adminRecipients = await getAdminRecipients();
            const assigneeRecipient = ticket.assignedTo?._id
                ? await getUserRecipient(ticket.assignedTo._id)
                : null;
            const allRecipients = mergeRecipients(
                adminRecipients,
                assigneeRecipient ? [assigneeRecipient] : []
            );

            await notificationService.notify('TICKET_OVERDUE', {
                recipients: allRecipients,
                data: {
                    ticket: {
                        _id: ticket._id,
                        title: ticket.title,
                        priority: ticket.priority,
                        status: ticket.status,
                        dueDate: ticket.dueDate,
                        locationName: ticket.location?.name || 'N/A',
                    },
                    daysOverdue,
                },
            });
        }
    } catch (err) {
        console.error('❌ [SCHEDULER] Ticket overdue alerts failed:', err.message);
    }
};

/**
 * Send reminders for inspections scheduled today
 */
const sendInspectionTodayReminders = async () => {
    try {
        const { today } = getPacificDates();
        const { start, end } = getDayBounds(today);

        const inspections = await Inspection.find({
            scheduledDate: { $gte: start, $lte: end },
            status: { $in: ['pending', 'in_progress'] },
        })
            .populate('location', 'name')
            .populate('template', 'name')
            .populate('inspector', 'name email');

        console.log(`⏰ [SCHEDULER] Inspection TODAY reminders: ${inspections.length} found`);

        for (const inspection of inspections) {
            const recipient = await getUserRecipient(inspection.inspector?._id);
            if (!recipient) continue;

            await notificationService.notify('INSPECTION_REMINDER_TODAY', {
                recipients: [recipient],
                data: {
                    inspection: {
                        _id: inspection._id,
                        locationName: inspection.location?.name || 'N/A',
                        templateName: inspection.template?.name || 'N/A',
                        status: inspection.status,
                        scheduledDate: inspection.scheduledDate,
                    },
                },
            });
        }
    } catch (err) {
        console.error('❌ [SCHEDULER] Inspection today reminders failed:', err.message);
    }
};

/**
 * Send reminders for inspections scheduled tomorrow
 */
const sendInspectionTomorrowReminders = async () => {
    try {
        const { tomorrow } = getPacificDates();
        const { start, end } = getDayBounds(tomorrow);

        const inspections = await Inspection.find({
            scheduledDate: { $gte: start, $lte: end },
            status: { $in: ['pending', 'in_progress'] },
        })
            .populate('location', 'name')
            .populate('template', 'name')
            .populate('inspector', 'name email');

        console.log(`⏰ [SCHEDULER] Inspection TOMORROW reminders: ${inspections.length} found`);

        for (const inspection of inspections) {
            const recipient = await getUserRecipient(inspection.inspector?._id);
            if (!recipient) continue;

            await notificationService.notify('INSPECTION_REMINDER_TOMORROW', {
                recipients: [recipient],
                data: {
                    inspection: {
                        _id: inspection._id,
                        locationName: inspection.location?.name || 'N/A',
                        templateName: inspection.template?.name || 'N/A',
                        scheduledDate: inspection.scheduledDate,
                    },
                },
            });
        }
    } catch (err) {
        console.error('❌ [SCHEDULER] Inspection tomorrow reminders failed:', err.message);
    }
};

/**
 * Initialize all scheduled jobs
 */
const initializeScheduler = () => {
    // Run every day at 8:00 AM Pacific Time
    cron.schedule('0 8 * * *', async () => {
        console.log('\n⏰ ═══ DAILY REMINDER JOB STARTED ═══');
        console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: TIMEZONE })}`);

        await sendTicketTodayReminders();
        await sendTicketTomorrowReminders();
        await sendTicketOverdueAlerts();
        await sendInspectionTodayReminders();
        await sendInspectionTomorrowReminders();

        console.log('⏰ ═══ DAILY REMINDER JOB COMPLETED ═══\n');
    }, {
        timezone: TIMEZONE,
    });

    console.log(`⏰ Notification scheduler initialized (Daily at 8:00 AM ${TIMEZONE})`);
};

module.exports = { initializeScheduler };
