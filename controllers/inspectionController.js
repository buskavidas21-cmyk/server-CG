const Inspection = require('../models/inspectionModel');

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
    const inspection = await Inspection.findById(req.params.id);
    if (inspection) {
        Object.assign(inspection, req.body);
        const updatedInspection = await inspection.save();
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
    const inspection = await Inspection.findById(req.params.id);
    if (inspection) {
        await inspection.deleteOne();
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
    const inspection = await Inspection.findById(req.params.id);
    if (inspection) {
        inspection.inspector = req.body.inspector;
        inspection.status = 'pending'; // Reset to pending on new assignment
        const updatedInspection = await inspection.save();
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
    const inspection = await Inspection.findById(req.params.id);
    if (inspection) {
        inspection.scheduledDate = req.body.scheduledDate;
        if (inspection.status !== 'completed' && inspection.status !== 'submitted') {
            inspection.status = 'pending';
        }
        const updatedInspection = await inspection.save();
        res.json(updatedInspection);
    } else {
        res.status(404);
        throw new Error('Inspection not found');
    }
};

module.exports = { getInspections, createInspection, getInspectionById, updateInspection, deleteInspection, generatePDF, assignInspection, scheduleInspection };
