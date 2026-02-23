const Inspection = require('../models/inspectionModel');
const notificationService = require('../utils/notifications/notificationService');
const { getAdminRecipients, getUserRecipient, getClientRecipientsForLocation, mergeRecipients } = require('../utils/notifications/notificationHelper');

// @desc    Get all inspections
// @route   GET /api/inspections
// @access  Private
const getInspections = async (req, res) => {
    let query = {};

    // Admin and sub_admin see all inspections
    if (req.user.role === 'admin' || req.user.role === 'sub_admin') {
        if (req.query.inspector) {
            query = { inspector: req.query.inspector };
        } else {
            query = {};
        }
    }
    // Supervisors see only their assigned inspections
    else if (req.user.role === 'supervisor') {
        query = { inspector: req.user._id };
    }
    // Clients see only inspections for their assigned locations
    else if (req.user.role === 'client') {
        query = { location: { $in: req.user.assignedLocations } };
    }

    const inspections = await Inspection.find(query)
        .populate('inspector', 'name')
        .populate('location', 'name')
        .populate('template', 'name');
    res.json(inspections);
};

// @desc    Create an inspection
// @route   POST /api/inspections
// @access  Private
const createInspection = async (req, res) => {
    const {
        template,
        location,
        sections,
        totalScore,
        status,
        summaryComment,
        inspector, // Extract inspector from body
    } = req.body;

    // Determine the inspector:
    // 1. If provided in body AND user is admin/sub-admin, use provided ID.
    // 2. Otherwise, default to the logged-in user (supervisor performing ad-hoc).
    let assignedInspector = req.user._id;
    if (inspector && (req.user.role === 'admin' || req.user.role === 'sub_admin')) {
        assignedInspector = inspector;
    }

    const inspection = new Inspection({
        template,
        location,
        inspector: assignedInspector,
        sections,
        totalScore,
        status,
        summaryComment,
    });

    // Calculate APPA Score (1-5) based on percentage
    // Level 1: 90-100% (Orderly Spotlessness)
    // Level 2: 80-89% (Ordinary Tidiness)
    // Level 3: 70-79% (Casual Inattention)
    // Level 4: 60-69% (Moderate Dinginess)
    // Level 5: < 60% (Unkempt Neglect)
    let appaScore = 5;
    if (totalScore >= 90) appaScore = 1;
    else if (totalScore >= 80) appaScore = 2;
    else if (totalScore >= 70) appaScore = 3;
    else if (totalScore >= 60) appaScore = 4;

    inspection.appaScore = appaScore;

    const createdInspection = await inspection.save();

    // ─── Send Notifications (non-blocking) ──────────────────────
    const populatedInspection = await Inspection.findById(createdInspection._id)
        .populate('location', 'name')
        .populate('template', 'name')
        .populate('inspector', 'name email');

    (async () => {
        try {
            const inspectionData = {
                _id: populatedInspection._id,
                locationName: populatedInspection.location?.name || 'N/A',
                templateName: populatedInspection.template?.name || 'N/A',
                totalScore: populatedInspection.totalScore,
                appaScore: populatedInspection.appaScore,
                status: populatedInspection.status,
                summaryComment: populatedInspection.summaryComment,
            };
            const inspectorName = populatedInspection.inspector?.name || 'Unknown';

            // If completed/submitted → notify admins + clients
            if (status === 'completed' || status === 'submitted') {
                const adminRecipients = await getAdminRecipients();
                const clientRecipients = await getClientRecipientsForLocation(location);
                const allRecipients = mergeRecipients(adminRecipients, clientRecipients);

                await notificationService.notify('INSPECTION_COMPLETED', {
                    recipients: allRecipients,
                    data: { inspection: inspectionData, inspectorName },
                    meta: { triggeredBy: req.user._id },
                });

                // If deficient → send additional alert
                if (totalScore < 75) {
                    await notificationService.notify('INSPECTION_DEFICIENT', {
                        recipients: allRecipients,
                        data: { inspection: inspectionData, inspectorName },
                        meta: { triggeredBy: req.user._id },
                    });
                }
            }
        } catch (err) {
            console.error('Notification error (inspection created):', err.message);
        }
    })();

    res.status(201).json(createdInspection);
};

// @desc    Get inspection by ID
// @route   GET /api/inspections/:id
// @access  Private
const getInspectionById = async (req, res) => {
    const inspection = await Inspection.findById(req.params.id)
        .populate('inspector', 'name')
        .populate('location', 'name')
        .populate('template', 'name');

    if (inspection) {
        res.json(inspection);
    } else {
        res.status(404);
        throw new Error('Inspection not found');
    }
};

// @desc    Update inspection
// @route   PUT /api/inspections/:id
// @access  Private
const updateInspection = async (req, res) => {
    const inspection = await Inspection.findById(req.params.id)
        .populate('location', 'name')
        .populate('template', 'name')
        .populate('inspector', 'name email');

    if (inspection) {
        const oldStatus = inspection.status;
        const oldInspectorId = inspection.inspector?._id?.toString();
        const previousInspectorName = inspection.inspector?.name;

        Object.assign(inspection, req.body);
        const updatedInspection = await inspection.save();

        const inspectionData = {
            _id: inspection._id,
            locationName: inspection.location?.name || 'N/A',
            templateName: inspection.template?.name || 'N/A',
            totalScore: updatedInspection.totalScore,
            appaScore: updatedInspection.appaScore,
            summaryComment: updatedInspection.summaryComment,
        };
        const inspectorName = inspection.inspector?.name || 'Unknown';

        // ─── Send Notifications (non-blocking) ────────────────
        (async () => {
            try {
                // --- Status change notifications ---
                const newStatus = req.body.status;
                if (newStatus && newStatus !== oldStatus) {
                    if (newStatus === 'completed' || newStatus === 'submitted') {
                        const adminRecipients = await getAdminRecipients();
                        const clientRecipients = await getClientRecipientsForLocation(inspection.location?._id);
                        const allRecipients = mergeRecipients(adminRecipients, clientRecipients);

                        await notificationService.notify('INSPECTION_COMPLETED', {
                            recipients: allRecipients,
                            data: { inspection: inspectionData, inspectorName },
                            meta: { triggeredBy: req.user._id },
                        });

                        if (updatedInspection.totalScore < 75) {
                            await notificationService.notify('INSPECTION_DEFICIENT', {
                                recipients: allRecipients,
                                data: { inspection: inspectionData, inspectorName },
                                meta: { triggeredBy: req.user._id },
                            });
                        }
                    }
                }

                // --- Reassignment via PUT notification ---
                const newInspectorId = req.body.inspector?.toString();
                if (newInspectorId && newInspectorId !== oldInspectorId) {
                    const newInspectorRecipient = await getUserRecipient(newInspectorId);
                    if (newInspectorRecipient) {
                        await notificationService.notify('INSPECTION_REASSIGNED', {
                            recipients: [newInspectorRecipient],
                            data: {
                                inspection: inspectionData,
                                reassignedByName: req.user.name,
                                previousInspectorName: previousInspectorName || 'Unassigned',
                            },
                            meta: { triggeredBy: req.user._id },
                        });
                    }
                }
            } catch (err) {
                console.error('Notification error (inspection update):', err.message);
            }
        })();

        res.json(updatedInspection);
    } else {
        res.status(404);
        throw new Error('Inspection not found');
    }
};

// @desc    Delete inspection
// @route   DELETE /api/inspections/:id
// @access  Private
const deleteInspection = async (req, res) => {
    const inspection = await Inspection.findById(req.params.id)
        .populate('location', 'name')
        .populate('template', 'name')
        .populate('inspector', 'name email');

    if (inspection) {
        const inspectionData = {
            _id: inspection._id,
            locationName: inspection.location?.name || 'N/A',
            templateName: inspection.template?.name || 'N/A',
            totalScore: inspection.totalScore,
        };
        const inspectorId = inspection.inspector?._id;

        await inspection.deleteOne();

        // ─── Send Notification (non-blocking) ────────────────
        (async () => {
            try {
                const adminRecipients = await getAdminRecipients();
                const inspectorRecipient = inspectorId
                    ? await getUserRecipient(inspectorId)
                    : null;
                const allRecipients = mergeRecipients(
                    adminRecipients,
                    inspectorRecipient ? [inspectorRecipient] : []
                );

                await notificationService.notify('INSPECTION_DELETED', {
                    recipients: allRecipients,
                    data: {
                        inspection: inspectionData,
                        deletedByName: req.user.name,
                    },
                    meta: { triggeredBy: req.user._id },
                });
            } catch (err) {
                console.error('Notification error (inspection deleted):', err.message);
            }
        })();

        res.json({ message: 'Inspection removed' });
    } else {
        res.status(404);
        throw new Error('Inspection not found');
    }
};

// @desc    Generate PDF report for inspection
// @route   GET /api/inspections/:id/pdf
// @access  Private
const generatePDF = async (req, res) => {
    try {
        const inspection = await Inspection.findById(req.params.id)
            .populate('location')
            .populate('template')
            .populate('inspector', 'name email');

        if (!inspection) {
            return res.status(404).json({ message: 'Inspection not found' });
        }

        const { generateInspectionPDF } = require('../utils/pdfGenerator');
        const fs = require('fs');
        const path = require('path');

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `inspection-${inspection._id}.pdf`;
        const filepath = path.join(reportsDir, filename);

        await generateInspectionPDF(inspection, filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('File deletion error:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Quick assign inspection
// @route   PATCH /api/inspections/:id/assign
// @access  Private
const assignInspection = async (req, res) => {
    const inspection = await Inspection.findById(req.params.id)
        .populate('location', 'name')
        .populate('template', 'name');

    if (inspection) {
        inspection.inspector = req.body.inspector;
        inspection.status = 'pending'; // Reset to pending on new assignment
        const updatedInspection = await inspection.save();

        // ─── Send Notification to assigned supervisor ───────────
        (async () => {
            try {
                const inspectorRecipient = await getUserRecipient(req.body.inspector);
                if (inspectorRecipient) {
                    await notificationService.notify('INSPECTION_ASSIGNED', {
                        recipients: [inspectorRecipient],
                        data: {
                            inspection: {
                                _id: inspection._id,
                                locationName: inspection.location?.name || 'N/A',
                                templateName: inspection.template?.name || 'N/A',
                                scheduledDate: inspection.scheduledDate,
                            },
                            assignedByName: req.user.name,
                        },
                        meta: { triggeredBy: req.user._id },
                    });
                }
            } catch (err) {
                console.error('Notification error (inspection assign):', err.message);
            }
        })();

        res.json(updatedInspection);
    } else {
        res.status(404);
        throw new Error('Inspection not found');
    }
};

// @desc    Quick schedule inspection
// @route   PATCH /api/inspections/:id/schedule
// @access  Private
const scheduleInspection = async (req, res) => {
    const inspection = await Inspection.findById(req.params.id)
        .populate('location', 'name')
        .populate('template', 'name');

    if (inspection) {
        inspection.scheduledDate = req.body.scheduledDate;
        if (inspection.status !== 'completed' && inspection.status !== 'submitted') {
            inspection.status = 'pending';
        }
        const updatedInspection = await inspection.save();

        // ─── Send Notification to assigned inspector ────────────
        (async () => {
            try {
                const inspectorRecipient = await getUserRecipient(inspection.inspector);
                if (inspectorRecipient) {
                    await notificationService.notify('INSPECTION_SCHEDULED', {
                        recipients: [inspectorRecipient],
                        data: {
                            inspection: {
                                _id: inspection._id,
                                locationName: inspection.location?.name || 'N/A',
                                templateName: inspection.template?.name || 'N/A',
                            },
                            scheduledDate: req.body.scheduledDate,
                        },
                        meta: { triggeredBy: req.user._id },
                    });
                }
            } catch (err) {
                console.error('Notification error (inspection schedule):', err.message);
            }
        })();

        res.json(updatedInspection);
    } else {
        res.status(404);
        throw new Error('Inspection not found');
    }
};

module.exports = { getInspections, createInspection, getInspectionById, updateInspection, deleteInspection, generatePDF, assignInspection, scheduleInspection };
