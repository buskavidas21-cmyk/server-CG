const Inspection = require('../models/inspectionModel');
const Ticket = require('../models/ticketModel');
const { generateSummaryReport } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

// @desc    Generate summary report
// @route   GET /api/reports/summary
// @access  Private (Admin/Sub-admin)
const getSummaryReport = async (req, res) => {
    try {
        const { startDate, endDate, type = 'all' } = req.query;

        // Validate dates
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        // Adjust end date to include the full day
        end.setHours(23, 59, 59, 999);

        const query = {
            createdAt: { $gte: start, $lte: end }
        };

        let inspections = [];
        let tickets = [];

        // Fetch Data
        if (type === 'all' || type === 'inspections') {
            inspections = await Inspection.find(query)
                .populate('location', 'name')
                .populate('template', 'name')
                .populate('inspector', 'name')
                .sort({ createdAt: -1 });
        }

        if (type === 'all' || type === 'tickets') {
            tickets = await Ticket.find(query)
                .populate('location', 'name')
                .populate('assignedTo', 'name')
                .sort({ createdAt: -1 });
        }

        // Calculate Stats
        const stats = {
            totalInspections: inspections.length,
            avgScore: inspections.length > 0
                ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / inspections.length)
                : 0,
            totalTickets: tickets.length,
            resolvedTickets: tickets.filter(t => ['resolved', 'closed', 'verified'].includes(t.status)).length,
            avgAppaScore: inspections.length > 0
                ? (inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / inspections.length).toFixed(1)
                : 0,
            avgResponseTime: tickets.filter(t => t.firstResponseAt).length > 0
                ? Math.round(tickets.filter(t => t.firstResponseAt).reduce((acc, curr) => {
                    const created = new Date(curr.createdAt);
                    const responded = new Date(curr.firstResponseAt);
                    return acc + (responded - created);
                }, 0) / tickets.filter(t => t.firstResponseAt).length / (1000 * 60 * 60)) // In Hours
                : 0
        };

        // Prepare Data for PDF
        const reportData = {
            startDate: start,
            endDate: end,
            type,
            stats,
            inspections,
            tickets
        };

        // Generate PDF
        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `summary-report-${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);

        await generateSummaryReport(reportData, filepath);

        // Send File
        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            // Delete file after download
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('File deletion error:', unlinkErr);
            });
        });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};

module.exports = { getSummaryReport };
