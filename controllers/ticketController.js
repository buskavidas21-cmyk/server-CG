const Ticket = require('../models/ticketModel');
const notificationService = require('../utils/notifications/notificationService');
const { getAdminRecipients, getUserRecipient, getClientRecipientsForLocation, mergeRecipients } = require('../utils/notifications/notificationHelper');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
    // 1. Initialize filter with basic properties from request
    let query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;

    // 2. Apply Role-Based Constraints
    if (req.user.role === 'admin' || req.user.role === 'sub_admin') {
        // Admins can filter by specific assignee
        if (req.query.assignedTo) {
            query.assignedTo = req.query.assignedTo;
        }
        // Otherwise, they see everything (subject to status/priority filters above)
    }
    else if (req.user.role === 'supervisor') {
        // Supervisors are restricted to their assigned tickets
        query.assignedTo = req.user._id;
    }
    else if (req.user.role === 'client') {
        // Clients are restricted to their locations
        query.location = { $in: req.user.assignedLocations };
    }

    try {
        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name')
            .populate('assignedTo', 'name')
            .populate('location', 'name')
            .sort({ createdAt: -1 }); // Show newest first
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// @desc    Create a ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
    const {
        title,
        description,
        priority,
        category,
        location,
        inspection,
        assignedTo,
        photos,
        dueDate,
        scheduledDate,
    } = req.body;

    const ticket = new Ticket({
        title,
        description,
        priority,
        category,
        location,
        inspection,
        createdBy: req.user._id,
        assignedTo,
        photos,
        dueDate,
        scheduledDate,
    });

    const createdTicket = await ticket.save();

    // ─── Send Notifications (non-blocking) ──────────────────────
    const populatedTicket = await Ticket.findById(createdTicket._id)
        .populate('location', 'name')
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name');

    const ticketData = {
        _id: populatedTicket._id,
        title: populatedTicket.title,
        description: populatedTicket.description,
        priority: populatedTicket.priority,
        category: populatedTicket.category,
        locationName: populatedTicket.location?.name || 'N/A',
        dueDate: populatedTicket.dueDate,
        assignedToName: populatedTicket.assignedTo?.name,
    };

    // Fire-and-forget notifications
    (async () => {
        try {
            const adminRecipients = await getAdminRecipients();
            const assigneeRecipient = assignedTo ? await getUserRecipient(assignedTo) : null;
            const allRecipients = mergeRecipients(adminRecipients, assigneeRecipient ? [assigneeRecipient] : []);

            // Check if urgent → send urgent alert
            if (priority === 'urgent') {
                await notificationService.notify('TICKET_URGENT', {
                    recipients: allRecipients,
                    data: { ticket: ticketData, createdByName: req.user.name },
                    meta: { triggeredBy: req.user._id },
                });
            } else {
                await notificationService.notify('TICKET_CREATED', {
                    recipients: allRecipients,
                    data: { ticket: ticketData, createdByName: req.user.name },
                    meta: { triggeredBy: req.user._id },
                });
            }
        } catch (err) {
            console.error('Notification error (ticket created):', err.message);
        }
    })();

    res.status(201).json(createdTicket);
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate('location', 'name')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

    if (ticket) {
        const oldStatus = ticket.status;

        // Track first response time
        if (req.body.status === 'in_progress' && ticket.status === 'open' && !ticket.firstResponseAt) {
            req.body.firstResponseAt = new Date();
        }

        // Track resolution details
        if (req.body.status === 'resolved' && ticket.status !== 'resolved') {
            req.body.resolvedAt = new Date();
            req.body.resolvedBy = req.user._id;
        }

        Object.assign(ticket, req.body);
        const updatedTicket = await ticket.save();

        // ─── Send Notifications (non-blocking) ─────────────────
        const newStatus = req.body.status;
        if (newStatus && newStatus !== oldStatus) {
            const ticketData = {
                _id: ticket._id,
                title: ticket.title,
                description: ticket.description,
                priority: ticket.priority,
                category: ticket.category,
                locationName: ticket.location?.name || 'N/A',
            };

            (async () => {
                try {
                    if (newStatus === 'resolved') {
                        // Notify: Admins + Creator + Client (location-based)
                        const adminRecipients = await getAdminRecipients();
                        const creatorRecipient = ticket.createdBy?._id
                            ? await getUserRecipient(ticket.createdBy._id)
                            : null;
                        const clientRecipients = await getClientRecipientsForLocation(ticket.location?._id);
                        const allRecipients = mergeRecipients(
                            adminRecipients,
                            creatorRecipient ? [creatorRecipient] : [],
                            clientRecipients
                        );

                        await notificationService.notify('TICKET_RESOLVED', {
                            recipients: allRecipients,
                            data: {
                                ticket: ticketData,
                                resolvedByName: req.user.name,
                                resolutionNotes: req.body.resolutionNotes || '',
                            },
                            meta: { triggeredBy: req.user._id },
                        });
                    } else if (newStatus === 'in_progress' && oldStatus === 'open') {
                        // Notify: Creator/Admin that ticket was picked up
                        const adminRecipients = await getAdminRecipients();
                        const creatorRecipient = ticket.createdBy?._id
                            ? await getUserRecipient(ticket.createdBy._id)
                            : null;
                        const allRecipients = mergeRecipients(
                            adminRecipients,
                            creatorRecipient ? [creatorRecipient] : []
                        );

                        await notificationService.notify('TICKET_STATUS_CHANGED', {
                            recipients: allRecipients,
                            data: {
                                ticket: ticketData,
                                oldStatus,
                                newStatus,
                                changedByName: req.user.name,
                            },
                            meta: { triggeredBy: req.user._id },
                        });
                    }
                } catch (err) {
                    console.error('Notification error (ticket update):', err.message);
                }
            })();
        }

        res.json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

// @desc    Quick assign ticket
// @route   PATCH /api/tickets/:id/assign
// @access  Private
const assignTicket = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate('location', 'name');

    if (ticket) {
        ticket.assignedTo = req.body.assignedTo;
        const updatedTicket = await ticket.save();

        // ─── Send Notification to assigned supervisor ───────────
        (async () => {
            try {
                const assigneeRecipient = await getUserRecipient(req.body.assignedTo);
                if (assigneeRecipient) {
                    await notificationService.notify('TICKET_ASSIGNED', {
                        recipients: [assigneeRecipient],
                        data: {
                            ticket: {
                                _id: ticket._id,
                                title: ticket.title,
                                description: ticket.description,
                                priority: ticket.priority,
                                category: ticket.category,
                                locationName: ticket.location?.name || 'N/A',
                                dueDate: ticket.dueDate,
                            },
                            assignedToName: assigneeRecipient.name,
                            assignedByName: req.user.name,
                        },
                        meta: { triggeredBy: req.user._id },
                    });
                }
            } catch (err) {
                console.error('Notification error (ticket assign):', err.message);
            }
        })();

        res.json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

// @desc    Quick schedule ticket
// @route   PATCH /api/tickets/:id/schedule
// @access  Private
const scheduleTicket = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate('location', 'name')
        .populate('assignedTo', 'name email');

    if (ticket) {
        ticket.scheduledDate = req.body.scheduledDate;
        const updatedTicket = await ticket.save();

        // ─── Send Notification to assigned supervisor ───────────
        if (ticket.assignedTo) {
            (async () => {
                try {
                    const assigneeRecipient = await getUserRecipient(ticket.assignedTo._id);
                    if (assigneeRecipient) {
                        await notificationService.notify('TICKET_SCHEDULED', {
                            recipients: [assigneeRecipient],
                            data: {
                                ticket: {
                                    _id: ticket._id,
                                    title: ticket.title,
                                    priority: ticket.priority,
                                    locationName: ticket.location?.name || 'N/A',
                                },
                                scheduledDate: req.body.scheduledDate,
                            },
                            meta: { triggeredBy: req.user._id },
                        });
                    }
                } catch (err) {
                    console.error('Notification error (ticket schedule):', err.message);
                }
            })();
        }

        res.json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('location', 'name');

    if (ticket) {
        res.json(ticket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

module.exports = { getTickets, createTicket, updateTicket, assignTicket, scheduleTicket, getTicketById };
