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

// Generate Overall Report PDF
const generateOverallReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Overall Report', period);

            // Summary Stats
            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Performance Overview', 50);
            doc.moveDown(1);

            const statsY = doc.y;
            const boxWidth = 150;
            const boxHeight = 60;

            const drawStatCard = (x, label, value, color) => {
                doc.roundedRect(x, statsY, boxWidth, boxHeight, 8).fillAndStroke(COLORS.white, COLORS.border);
                doc.path(`M${x + 5},${statsY + 10} L${x + 5},${statsY + boxHeight - 10}`).lineWidth(3).strokeColor(color).stroke();
                doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica').text(label, x + 20, statsY + 10);
                doc.fillColor(COLORS.text).fontSize(20).font('Helvetica-Bold').text(String(value), x + 20, statsY + 30);
            };

            drawStatCard(50, 'Total Inspections', data.overall.totalInspections, COLORS.primary);
            drawStatCard(220, 'Avg Score', `${data.overall.avgScore}%`, COLORS.success);
            drawStatCard(390, 'Total Tickets', data.overall.totalTickets, COLORS.danger);
            drawStatCard(50, 'Open Tickets', data.overall.openTickets, COLORS.warning);
            drawStatCard(220, 'Resolved', data.overall.resolvedTickets, COLORS.success);
            drawStatCard(390, 'APPA Score', data.overall.avgAppaScore, COLORS.primary);

            doc.moveDown(8);

            // Location Performance Table
            if (data.locationPerformance && data.locationPerformance.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Lowest-Performing Locations', 50);
                doc.moveDown(1);

                const startX = 50;
                let currentY = doc.y;
                const rowHeight = 25;

                // Header
                doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.primary);
                doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
                doc.text('Location', startX + 10, currentY + 8);
                doc.text('Inspections', startX + 200, currentY + 8);
                doc.text('Avg Score', startX + 300, currentY + 8);
                doc.text('Tickets', startX + 400, currentY + 8);

                currentY += rowHeight;

                // Data Rows
                doc.font('Helvetica').fontSize(10);
                data.locationPerformance.slice(0, 20).forEach((loc, i) => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }

                    if (i % 2 === 0) {
                        doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.accent);
                    }

                    doc.fillColor(COLORS.text);
                    doc.text(loc.locationName || 'Unknown', startX + 10, currentY + 8, { width: 180, ellipsis: true });
                    doc.text(String(loc.inspectionCount), startX + 200, currentY + 8);
                    
                    const scoreColor = loc.averageScore >= 90 ? COLORS.success : loc.averageScore >= 75 ? COLORS.warning : COLORS.danger;
                    doc.fillColor(scoreColor);
                    doc.text(`${loc.averageScore}%`, startX + 300, currentY + 8);
                    
                    doc.fillColor(COLORS.text);
                    doc.text(String(loc.ticketCount), startX + 400, currentY + 8);

                    currentY += rowHeight;
                });
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

// Generate Tickets Report PDF
const generateTicketsReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Tickets Report', period);

            // Responsiveness Metrics
            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Team Responsiveness', 50);
            doc.moveDown(1);

            const statsY = doc.y;
            const boxWidth = 150;
            const boxHeight = 60;

            const drawStatCard = (x, label, value, color) => {
                doc.roundedRect(x, statsY, boxWidth, boxHeight, 8).fillAndStroke(COLORS.white, COLORS.border);
                doc.path(`M${x + 5},${statsY + 10} L${x + 5},${statsY + boxHeight - 10}`).lineWidth(3).strokeColor(color).stroke();
                doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica').text(label, x + 20, statsY + 10);
                doc.fillColor(COLORS.text).fontSize(20).font('Helvetica-Bold').text(String(value), x + 20, statsY + 30);
            };

            drawStatCard(50, 'Total Tickets', data.responsiveness.totalTickets, COLORS.primary);
            drawStatCard(220, 'Avg Response', `${data.responsiveness.avgResponseTime}h`, COLORS.warning);
            drawStatCard(390, 'Avg Resolution', `${data.responsiveness.avgResolutionTime}h`, COLORS.success);
            drawStatCard(50, 'Response Rate', `${data.responsiveness.responseRate}%`, COLORS.primary);

            doc.moveDown(8);

            // Location Complaints Table
            if (data.locationComplaints && data.locationComplaints.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Locations with Most Complaints', 50);
                doc.moveDown(1);

                const startX = 50;
                let currentY = doc.y;
                const rowHeight = 25;

                // Header
                doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.primary);
                doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
                doc.text('Location', startX + 10, currentY + 8);
                doc.text('Total', startX + 200, currentY + 8);
                doc.text('Open', startX + 280, currentY + 8);
                doc.text('Resolved', startX + 340, currentY + 8);
                doc.text('Avg Response', startX + 420, currentY + 8);

                currentY += rowHeight;

                // Data Rows
                doc.font('Helvetica').fontSize(10);
                data.locationComplaints.slice(0, 20).forEach((loc, i) => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }

                    if (i % 2 === 0) {
                        doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.accent);
                    }

                    doc.fillColor(COLORS.text);
                    doc.text(loc.locationName || 'Unknown', startX + 10, currentY + 8, { width: 180, ellipsis: true });
                    doc.text(String(loc.totalTickets), startX + 200, currentY + 8);
                    doc.fillColor(COLORS.danger);
                    doc.text(String(loc.openTickets), startX + 280, currentY + 8);
                    doc.fillColor(COLORS.success);
                    doc.text(String(loc.resolvedTickets), startX + 340, currentY + 8);
                    doc.fillColor(COLORS.text);
                    doc.text(loc.avgResponseTime > 0 ? `${loc.avgResponseTime}h` : 'N/A', startX + 420, currentY + 8);

                    currentY += rowHeight;
                });
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

// Generate Inspector Leaderboard PDF
const generateInspectorLeaderboardPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Inspector Leaderboard', period);

            // Summary
            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Summary', 50);
            doc.moveDown(1);

            doc.fontSize(10).font('Helvetica');
            doc.text(`Total Inspectors: ${data.summary.totalInspectors}`, 50);
            doc.text(`Total Inspections: ${data.summary.totalInspections}`, 200);
            doc.text(`Overall Avg Score: ${data.summary.overallAvgScore}%`, 350);

            doc.moveDown(4);

            // Leaderboard Table
            if (data.leaderboard && data.leaderboard.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Inspector Rankings', 50);
                doc.moveDown(1);

                const startX = 50;
                let currentY = doc.y;
                const rowHeight = 30;

                // Header
                doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.primary);
                doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
                doc.text('Rank', startX + 10, currentY + 10);
                doc.text('Inspector', startX + 60, currentY + 10);
                doc.text('Inspections', startX + 250, currentY + 10);
                doc.text('Avg Score', startX + 350, currentY + 10);
                doc.text('APPA', startX + 430, currentY + 10);

                currentY += rowHeight;

                // Data Rows
                doc.font('Helvetica').fontSize(10);
                data.leaderboard.forEach((inspector, i) => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }

                    if (i % 2 === 0) {
                        doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.accent);
                    }

                    doc.fillColor(COLORS.text);
                    doc.text(`#${i + 1}`, startX + 10, currentY + 10);
                    doc.text(inspector.inspectorName || 'Unknown', startX + 60, currentY + 10, { width: 180, ellipsis: true });
                    doc.text(String(inspector.inspectionCount), startX + 250, currentY + 10);
                    
                    const scoreColor = inspector.averageScore >= 90 ? COLORS.success : inspector.averageScore >= 75 ? COLORS.warning : COLORS.danger;
                    doc.fillColor(scoreColor);
                    doc.text(`${inspector.averageScore}%`, startX + 350, currentY + 10);
                    
                    doc.fillColor(COLORS.text);
                    doc.text(String(inspector.avgAppaScore), startX + 430, currentY + 10);

                    currentY += rowHeight;
                });
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

// Generate Private Inspections Report PDF
const generatePrivateInspectionsReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Private Inspections Report', period);

            // Summary
            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Summary', 50);
            doc.moveDown(1);

            doc.fontSize(10).font('Helvetica');
            doc.text(`Total Private Inspections: ${data.summary.totalPrivateInspections}`, 50);
            doc.text(`Average Score: ${data.summary.avgScore}%`, 250);
            doc.text(`Avg APPA Score: ${data.summary.avgAppaScore}`, 400);

            doc.moveDown(4);

            // Inspector Performance Table
            if (data.inspectorPerformance && data.inspectorPerformance.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Inspector Performance (Internal)', 50);
                doc.moveDown(1);

                const startX = 50;
                let currentY = doc.y;
                const rowHeight = 30;

                // Header
                doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.primary);
                doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
                doc.text('Inspector', startX + 10, currentY + 10);
                doc.text('Inspections', startX + 250, currentY + 10);
                doc.text('Avg Score', startX + 350, currentY + 10);
                doc.text('APPA', startX + 430, currentY + 10);

                currentY += rowHeight;

                // Data Rows
                doc.font('Helvetica').fontSize(10);
                data.inspectorPerformance.forEach((perf, i) => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }

                    if (i % 2 === 0) {
                        doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.accent);
                    }

                    doc.fillColor(COLORS.text);
                    doc.text(perf.inspectorName || 'Unknown', startX + 10, currentY + 10, { width: 230, ellipsis: true });
                    doc.text(String(perf.inspectionCount), startX + 250, currentY + 10);
                    
                    const scoreColor = perf.averageScore >= 90 ? COLORS.success : perf.averageScore >= 75 ? COLORS.warning : COLORS.danger;
                    doc.fillColor(scoreColor);
                    doc.text(`${perf.averageScore}%`, startX + 350, currentY + 10);
                    
                    doc.fillColor(COLORS.text);
                    doc.text(String(perf.avgAppaScore), startX + 430, currentY + 10);

                    currentY += rowHeight;
                });
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

// Generate Inspection Forms Report PDF
const generateInspectionFormsReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Inspection Forms Report', period);

            // Area Type Performance
            if (data.areaTypePerformance && data.areaTypePerformance.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Area Type Performance', 50);
                doc.moveDown(1);

                const startX = 50;
                let currentY = doc.y;
                const rowHeight = 30;

                // Header
                doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.primary);
                doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
                doc.text('Area Type', startX + 10, currentY + 10);
                doc.text('Inspections', startX + 250, currentY + 10);
                doc.text('Avg Score', startX + 350, currentY + 10);

                currentY += rowHeight;

                // Data Rows
                doc.font('Helvetica').fontSize(10);
                data.areaTypePerformance.forEach((area, i) => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }

                    if (i % 2 === 0) {
                        doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.accent);
                    }

                    doc.fillColor(COLORS.text);
                    const areaName = area.areaType.charAt(0).toUpperCase() + area.areaType.slice(1);
                    doc.text(areaName, startX + 10, currentY + 10, { width: 230, ellipsis: true });
                    doc.text(String(area.inspectionCount), startX + 250, currentY + 10);
                    
                    const scoreColor = area.averageScore >= 90 ? COLORS.success : area.averageScore >= 75 ? COLORS.warning : COLORS.danger;
                    doc.fillColor(scoreColor);
                    doc.text(`${area.averageScore}%`, startX + 350, currentY + 10);

                    currentY += rowHeight;

                    // Lowest performing items (first 3)
                    if (area.lowestPerformingItems && area.lowestPerformingItems.length > 0) {
                        doc.fillColor(COLORS.secondary).fontSize(9);
                        area.lowestPerformingItems.slice(0, 3).forEach((item, itemIdx) => {
                            if (currentY > 700) {
                                doc.addPage();
                                currentY = 50;
                            }
                            doc.text(`  • ${item.itemName}: ${item.failRate}% fail rate`, startX + 20, currentY + 5, { width: 450, ellipsis: true });
                            currentY += 20;
                        });
                        currentY += 5;
                    }
                });
            }

            doc.moveDown(2);

            // Template Performance
            if (data.templatePerformance && data.templatePerformance.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Template Performance', 50);
                doc.moveDown(1);

                const startX = 50;
                let currentY = doc.y;
                const rowHeight = 30;

                // Header
                doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.primary);
                doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
                doc.text('Template', startX + 10, currentY + 10);
                doc.text('Inspections', startX + 300, currentY + 10);
                doc.text('Avg Score', startX + 400, currentY + 10);

                currentY += rowHeight;

                // Data Rows
                doc.font('Helvetica').fontSize(10);
                data.templatePerformance.forEach((template, i) => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }

                    if (i % 2 === 0) {
                        doc.rect(startX, currentY, 500, rowHeight).fill(COLORS.accent);
                    }

                    doc.fillColor(COLORS.text);
                    doc.text(template.templateName || 'Unknown', startX + 10, currentY + 10, { width: 280, ellipsis: true });
                    doc.text(String(template.inspectionCount), startX + 300, currentY + 10);
                    
                    const scoreColor = template.averageScore >= 90 ? COLORS.success : template.averageScore >= 75 ? COLORS.warning : COLORS.danger;
                    doc.fillColor(scoreColor);
                    doc.text(`${template.averageScore}%`, startX + 400, currentY + 10);

                    currentY += rowHeight;
                });
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

module.exports = { 
    generateInspectionPDF, 
    generateSummaryReport,
    generateOverallReportPDF,
    generateTicketsReportPDF,
    generateInspectorLeaderboardPDF,
    generatePrivateInspectionsReportPDF,
    generateInspectionFormsReportPDF
};
