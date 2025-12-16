const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Design Constants
const COLORS = {
    primary: '#4f46e5', // Indigo 600
    secondary: '#64748b', // Slate 500
    accent: '#f8fafc', // Slate 50
    text: '#1e293b', // Slate 800
    border: '#e2e8f0', // Slate 200
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    white: '#ffffff'
};

const drawHeader = (doc, title, subtitle) => {
    // Top accent bar
    doc.rect(0, 0, doc.page.width, 10).fill(COLORS.primary);

    // Logo area (placeholder)
    doc.fontSize(28).font('Helvetica-Bold').fillColor(COLORS.primary).text('CleanGuard', 50, 45);
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.secondary).text('QUALITY CONTROL', 50, 75, { characterSpacing: 2 });

    // Report Title
    doc.fontSize(24).font('Helvetica-Bold').fillColor(COLORS.text).text(title, 0, 45, { align: 'right', width: doc.page.width - 50 });
    if (subtitle) {
        doc.fontSize(12).font('Helvetica').fillColor(COLORS.secondary).text(subtitle, 0, 75, { align: 'right', width: doc.page.width - 50 });
    }

    // Divider
    doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.moveDown(4);
};

const drawFooter = (doc) => {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Bottom line
        doc.moveTo(50, doc.page.height - 50).lineTo(doc.page.width - 50, doc.page.height - 50).strokeColor(COLORS.border).lineWidth(1).stroke();

        doc.fontSize(8).font('Helvetica').fillColor(COLORS.secondary);
        doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, doc.page.height - 40);
        doc.text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40, { align: 'right', width: doc.page.width - 50 });
    }
};

const generateInspectionPDF = (inspection, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            drawHeader(doc, 'Inspection Report', `ID: #${inspection._id.toString().slice(-6).toUpperCase()}`);

            // Score Badge
            const score = inspection.totalScore || 0;
            let scoreColor = score >= 90 ? COLORS.success : score >= 75 ? COLORS.warning : COLORS.danger;

            // Info Grid
            const startY = 130;
            doc.rect(50, startY, 300, 100).fill(COLORS.accent);
            doc.fillColor(COLORS.text);

            const drawInfoRow = (label, value, y) => {
                doc.fontSize(10).font('Helvetica-Bold').text(label, 70, y);
                doc.font('Helvetica').text(value, 150, y);
            };

            drawInfoRow('Location:', inspection.location?.name || 'N/A', startY + 20);
            drawInfoRow('Template:', inspection.template?.name || 'N/A', startY + 45);
            drawInfoRow('Inspector:', inspection.inspector?.name || 'N/A', startY + 70);

            // Big Score Circle
            doc.circle(450, startY + 50, 45).lineWidth(5).strokeColor(scoreColor).stroke();
            doc.fontSize(28).font('Helvetica-Bold').fillColor(scoreColor).text(`${score}%`, 405, startY + 38, { width: 90, align: 'center' });
            doc.fontSize(10).font('Helvetica').fillColor(COLORS.secondary).text('TOTAL SCORE', 405, startY + 65, { width: 90, align: 'center' });

            doc.moveDown(8);

            // Sections
            inspection.sections?.forEach((section, idx) => {
                // Section Header
                doc.rect(50, doc.y, doc.page.width - 100, 30).fill(COLORS.border);
                doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text(section.name, 60, doc.y - 22);
                doc.moveDown(2);

                section.items?.forEach((item) => {
                    if (doc.y > 700) doc.addPage();

                    const statusColor = item.status === 'pass' ? COLORS.success : COLORS.danger;
                    const statusIcon = item.status === 'pass' ? 'P' : 'F'; // Simple text icon for now

                    // Item Row
                    const itemY = doc.y;

                    // Status Indicator
                    doc.circle(60, itemY + 6, 10).fill(statusColor);
                    doc.fillColor(COLORS.white).fontSize(8).font('Helvetica-Bold').text(statusIcon, 56, itemY + 3);

                    // Item Name
                    doc.fillColor(COLORS.text).fontSize(11).font('Helvetica').text(item.name, 85, itemY);

                    // Score
                    if (item.score !== null && item.score !== undefined) {
                        doc.fillColor(COLORS.secondary).fontSize(10).text(`${item.score}/5`, 450, itemY, { align: 'right' });
                    }

                    doc.moveDown(0.5);

                    // Comment
                    if (item.comment) {
                        doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica-Oblique').text(`Note: ${item.comment}`, 85);
                        doc.moveDown(0.5);
                    }

                    doc.moveDown(0.5);
                    doc.moveTo(85, doc.y).lineTo(550, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
                    doc.moveDown(1);
                });

                doc.moveDown(1);
            });

            drawFooter(doc);
            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

const generateSummaryReport = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            drawHeader(doc, 'Executive Summary', `${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`);

            // Statistics Grid
            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Performance Overview', 50);
            doc.moveDown(1);

            const statsY = doc.y;
            const boxWidth = 160;
            const boxHeight = 80;

            const drawStatCard = (x, label, value, subtext, color) => {
                // Card Shadow/Border
                doc.roundedRect(x, statsY, boxWidth, boxHeight, 8).fillAndStroke(COLORS.white, COLORS.border);
                // Accent Line
                doc.path(`M${x + 5},${statsY + 15} L${x + 5},${statsY + boxHeight - 15}`).lineWidth(3).strokeColor(color).stroke();

                doc.fillColor(COLORS.secondary).fontSize(10).font('Helvetica').text(label, x + 20, statsY + 15);
                doc.fillColor(COLORS.text).fontSize(24).font('Helvetica-Bold').text(String(value), x + 20, statsY + 35);
                if (subtext) {
                    doc.fillColor(color).fontSize(9).font('Helvetica-Bold').text(subtext, x + 20, statsY + 62);
                }
            };

            if (data.type === 'all' || data.type === 'inspections') {
                drawStatCard(50, 'Total Inspections', data.stats.totalInspections, 'Completed', COLORS.primary);

                const avgScore = data.stats.avgScore;
                const scoreColor = avgScore >= 90 ? COLORS.success : avgScore >= 75 ? COLORS.warning : COLORS.danger;
                drawStatCard(230, 'Average Score', `${avgScore}%`, 'Quality Rating', scoreColor);
            }

            if (data.type === 'all' || data.type === 'tickets') {
                const startX = (data.type === 'tickets') ? 50 : 410;
                drawStatCard(startX, 'Total Tickets', data.stats.totalTickets, `${data.stats.resolvedTickets} Resolved`, COLORS.danger);
            }

            doc.moveDown(8);

            // Helper for Table
            const drawTable = (title, columns, rows) => {
                if (rows.length === 0) return;

                if (doc.y > 650) doc.addPage();

                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text(title, 50);
                doc.moveDown(1);

                const startX = 50;
                let currentY = doc.y;
                const rowHeight = 30;

                // Header Row
                doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.primary);
                doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');

                columns.forEach((col, i) => {
                    doc.text(col.header, startX + col.x, currentY + 10, { width: col.width, align: 'left' });
                });

                currentY += rowHeight;

                // Data Rows
                doc.font('Helvetica').fontSize(10);
                rows.forEach((row, i) => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                        // Redraw header on new page? Optional, keeping simple for now.
                    }

                    // Zebra striping
                    if (i % 2 === 0) {
                        doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.accent);
                    }

                    doc.fillColor(COLORS.text);
                    columns.forEach((col) => {
                        let text = row[col.key];
                        // Custom formatting
                        if (col.format) text = col.format(row);

                        // Color overrides
                        if (col.color) doc.fillColor(col.color(row));
                        else doc.fillColor(COLORS.text);

                        doc.text(text, startX + col.x, currentY + 10, { width: col.width, lineBreak: false, ellipsis: true });
                    });

                    currentY += rowHeight;
                });
                doc.moveDown(2);
            };

            // Inspections Table
            if (data.type === 'all' || data.type === 'inspections') {
                drawTable('Recent Inspections', [
                    { header: 'Date', key: 'createdAt', x: 10, width: 80, format: r => new Date(r.createdAt).toLocaleDateString() },
                    { header: 'Location', key: 'location', x: 100, width: 120, format: r => r.location?.name || 'N/A' },
                    { header: 'Template', key: 'template', x: 230, width: 120, format: r => r.template?.name || 'N/A' },
                    { header: 'Score', key: 'totalScore', x: 360, width: 50, format: r => `${r.totalScore}%`, color: r => r.totalScore >= 90 ? COLORS.success : r.totalScore >= 75 ? COLORS.warning : COLORS.danger },
                    { header: 'Status', key: 'status', x: 420, width: 70, format: r => r.status.toUpperCase() }
                ], data.inspections);
            }

            // Tickets Table
            if (data.type === 'all' || data.type === 'tickets') {
                drawTable('Recent Tickets', [
                    { header: 'Date', key: 'createdAt', x: 10, width: 80, format: r => new Date(r.createdAt).toLocaleDateString() },
                    { header: 'Title', key: 'title', x: 100, width: 120 },
                    { header: 'Location', key: 'location', x: 230, width: 120, format: r => r.location?.name || 'N/A' },
                    { header: 'Priority', key: 'priority', x: 360, width: 60, format: r => r.priority.toUpperCase(), color: r => r.priority === 'urgent' ? COLORS.danger : r.priority === 'high' ? COLORS.warning : COLORS.text },
                    { header: 'Status', key: 'status', x: 430, width: 60, format: r => r.status.replace('_', ' ').toUpperCase() }
                ], data.tickets);
            }

            drawFooter(doc);
            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInspectionPDF, generateSummaryReport };
