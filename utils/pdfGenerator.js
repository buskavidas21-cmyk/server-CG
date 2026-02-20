const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COLORS = {
    primary: '#4f46e5',
    secondary: '#64748b',
    accent: '#f8fafc',
    text: '#1e293b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    white: '#ffffff'
};

const PAGE_BOTTOM = 720;
const CONTENT_WIDTH = 500;

const ensureSpace = (doc, needed) => {
    if (doc.y > PAGE_BOTTOM - needed) {
        doc.addPage();
        doc.y = 50;
    }
};

const syncY = (doc, y) => {
    doc.x = 50;
    doc.y = y;
};

const drawHeader = (doc, title, subtitle) => {
    doc.rect(0, 0, doc.page.width, 10).fill(COLORS.primary);
    doc.fontSize(28).font('Helvetica-Bold').fillColor(COLORS.primary).text('CleanGuard', 50, 45);
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.secondary).text('QUALITY CONTROL', 50, 75, { characterSpacing: 2 });
    doc.fontSize(24).font('Helvetica-Bold').fillColor(COLORS.text).text(title, 0, 45, { align: 'right', width: doc.page.width - 50 });
    if (subtitle) {
        doc.fontSize(12).font('Helvetica').fillColor(COLORS.secondary).text(subtitle, 0, 75, { align: 'right', width: doc.page.width - 50 });
    }
    doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100).strokeColor(COLORS.border).lineWidth(1).stroke();
    syncY(doc, 120);
};

const drawFooter = (doc) => {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        const savedBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        doc.moveTo(50, doc.page.height - 50).lineTo(doc.page.width - 50, doc.page.height - 50).strokeColor(COLORS.border).lineWidth(1).stroke();
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.secondary);
        doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, doc.page.height - 40, { lineBreak: false });
        doc.text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40, { align: 'right', width: doc.page.width - 50, lineBreak: false });

        doc.page.margins.bottom = savedBottom;
    }
};

const drawStatCards = (doc, cards, startY) => {
    const cols = Math.min(cards.length, 3);
    const gap = 20;
    const boxWidth = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
    const boxHeight = 60;

    cards.forEach((card, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = 50 + col * (boxWidth + gap);
        const y = startY + row * (boxHeight + 15);

        doc.roundedRect(x, y, boxWidth, boxHeight, 8).fillAndStroke(COLORS.white, COLORS.border);
        doc.save();
        doc.roundedRect(x + 3, y + 10, 3, boxHeight - 20, 2).fill(card.color);
        doc.restore();
        doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica').text(card.label, x + 18, y + 12, { width: boxWidth - 25, lineBreak: false });
        doc.fillColor(COLORS.text).fontSize(20).font('Helvetica-Bold').text(String(card.value), x + 18, y + 30, { width: boxWidth - 25, lineBreak: false });
    });

    const totalRows = Math.ceil(cards.length / 3);
    return startY + totalRows * (boxHeight + 15) + 15;
};

const drawTableHeader = (doc, columns, y, startX) => {
    doc.rect(startX, y, CONTENT_WIDTH, 28).fill(COLORS.primary);
    doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
    columns.forEach(col => {
        doc.text(col.header, startX + col.x, y + 9, { width: col.width || 100, lineBreak: false });
    });
    return y + 28;
};

const drawTableRow = (doc, columns, rowData, y, startX, isEven) => {
    if (isEven) {
        doc.rect(startX, y, CONTENT_WIDTH, 26).fill(COLORS.accent);
    }
    columns.forEach(col => {
        let text = col.format ? col.format(rowData) : String(rowData[col.key] ?? '');
        doc.fillColor(col.color ? col.color(rowData) : COLORS.text)
            .fontSize(10).font('Helvetica')
            .text(text, startX + col.x, y + 8, { width: col.width || 100, lineBreak: false, ellipsis: true });
    });
    return y + 26;
};

const drawTable = (doc, title, columns, rows, startX = 50) => {
    if (!rows || rows.length === 0) return;

    ensureSpace(doc, 80);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text(title, 50, doc.y);
    doc.moveDown(0.8);

    let currentY = doc.y;
    currentY = drawTableHeader(doc, columns, currentY, startX);

    rows.forEach((row, i) => {
        if (currentY > PAGE_BOTTOM) {
            doc.addPage();
            currentY = 50;
            currentY = drawTableHeader(doc, columns, currentY, startX);
        }
        currentY = drawTableRow(doc, columns, row, currentY, startX, i % 2 === 0);
    });

    syncY(doc, currentY + 10);
};

// ─── Individual Report PDF ───

const generateInspectionPDF = (inspection, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true, autoFirstPage: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            drawHeader(doc, 'Inspection Report', `ID: #${inspection._id.toString().slice(-6).toUpperCase()}`);

            const score = inspection.totalScore || 0;
            const scoreColor = score >= 90 ? COLORS.success : score >= 75 ? COLORS.warning : COLORS.danger;

            const startY = 130;
            doc.rect(50, startY, 300, 100).fill(COLORS.accent);
            doc.fillColor(COLORS.text);

            const drawInfoRow = (label, value, y) => {
                doc.fontSize(10).font('Helvetica-Bold').text(label, 70, y, { lineBreak: false });
                doc.font('Helvetica').text(value, 150, y, { lineBreak: false });
            };

            drawInfoRow('Location:', inspection.location?.name || 'N/A', startY + 20);
            drawInfoRow('Template:', inspection.template?.name || 'N/A', startY + 45);
            drawInfoRow('Inspector:', inspection.inspector?.name || 'N/A', startY + 70);

            doc.circle(450, startY + 50, 45).lineWidth(5).strokeColor(scoreColor).stroke();
            doc.fontSize(28).font('Helvetica-Bold').fillColor(scoreColor).text(`${score}%`, 405, startY + 38, { width: 90, align: 'center', lineBreak: false });
            doc.fontSize(10).font('Helvetica').fillColor(COLORS.secondary).text('TOTAL SCORE', 405, startY + 65, { width: 90, align: 'center', lineBreak: false });

            syncY(doc, startY + 120);

            inspection.sections?.forEach((section) => {
                ensureSpace(doc, 60);

                doc.rect(50, doc.y, CONTENT_WIDTH, 30).fill(COLORS.border);
                doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text(section.name, 60, doc.y + 8, { lineBreak: false });
                syncY(doc, doc.y + 40);

                section.items?.forEach((item) => {
                    ensureSpace(doc, 40);

                    const statusColor = item.status === 'pass' ? COLORS.success : COLORS.danger;
                    const statusIcon = item.status === 'pass' ? 'P' : 'F';
                    const itemY = doc.y;

                    doc.circle(60, itemY + 6, 10).fill(statusColor);
                    doc.fillColor(COLORS.white).fontSize(8).font('Helvetica-Bold').text(statusIcon, 56, itemY + 3, { lineBreak: false });
                    doc.fillColor(COLORS.text).fontSize(11).font('Helvetica').text(item.name, 85, itemY, { width: 350, lineBreak: false });

                    if (item.score !== null && item.score !== undefined) {
                        doc.fillColor(COLORS.secondary).fontSize(10).text(`${item.score}/5`, 450, itemY, { align: 'right', lineBreak: false });
                    }

                    let nextY = itemY + 18;

                    if (item.comment) {
                        doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica-Oblique').text(`Note: ${item.comment}`, 85, nextY, { width: 400 });
                        nextY += 14;
                    }

                    doc.moveTo(85, nextY).lineTo(550, nextY).strokeColor(COLORS.border).lineWidth(0.5).stroke();
                    syncY(doc, nextY + 8);
                });

                doc.y += 10;
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

// ─── Summary Report PDF ───

const generateSummaryReport = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            drawHeader(doc, 'Executive Summary', `${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`);

            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Performance Overview', 50);
            doc.moveDown(0.8);

            const cards = [];
            if (data.type === 'all' || data.type === 'inspections') {
                cards.push({ label: 'Total Inspections', value: data.stats.totalInspections, color: COLORS.primary });
                const avgScore = data.stats.avgScore;
                cards.push({ label: 'Average Score', value: `${avgScore}%`, color: avgScore >= 90 ? COLORS.success : avgScore >= 75 ? COLORS.warning : COLORS.danger });
            }
            if (data.type === 'all' || data.type === 'tickets') {
                cards.push({ label: 'Total Tickets', value: data.stats.totalTickets, color: COLORS.danger });
            }

            const afterCards = drawStatCards(doc, cards, doc.y);
            syncY(doc, afterCards + 10);

            if (data.type === 'all' || data.type === 'inspections') {
                drawTable(doc, 'Recent Inspections', [
                    { header: 'Date', key: 'createdAt', x: 10, width: 80, format: r => new Date(r.createdAt).toLocaleDateString() },
                    { header: 'Location', key: 'location', x: 100, width: 120, format: r => r.location?.name || 'N/A' },
                    { header: 'Template', key: 'template', x: 230, width: 120, format: r => r.template?.name || 'N/A' },
                    { header: 'Score', key: 'totalScore', x: 360, width: 50, format: r => `${r.totalScore}%`, color: r => r.totalScore >= 90 ? COLORS.success : r.totalScore >= 75 ? COLORS.warning : COLORS.danger },
                    { header: 'Status', key: 'status', x: 420, width: 70, format: r => r.status.toUpperCase() }
                ], data.inspections);
            }

            if (data.type === 'all' || data.type === 'tickets') {
                drawTable(doc, 'Recent Tickets', [
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

// ─── Overall Report PDF ───

const generateOverallReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Overall Report', period);

            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Performance Overview', 50);
            doc.moveDown(0.8);

            const afterCards = drawStatCards(doc, [
                { label: 'Total Inspections', value: data.overall.totalInspections, color: COLORS.primary },
                { label: 'Avg Score', value: `${data.overall.avgScore}%`, color: COLORS.success },
                { label: 'APPA Score', value: data.overall.avgAppaScore, color: COLORS.primary },
                { label: 'Total Tickets', value: data.overall.totalTickets, color: COLORS.danger },
                { label: 'Open Tickets', value: data.overall.openTickets, color: COLORS.warning },
                { label: 'Resolved', value: data.overall.resolvedTickets, color: COLORS.success },
            ], doc.y);
            syncY(doc, afterCards + 10);

            if (data.locationPerformance && data.locationPerformance.length > 0) {
                drawTable(doc, 'Lowest-Performing Locations', [
                    { header: 'Location', x: 10, width: 180, key: 'locationName', format: r => r.locationName || 'Unknown' },
                    { header: 'Inspections', x: 200, width: 80, key: 'inspectionCount', format: r => String(r.inspectionCount) },
                    { header: 'Avg Score', x: 300, width: 80, key: 'averageScore', format: r => `${r.averageScore}%`, color: r => r.averageScore >= 90 ? COLORS.success : r.averageScore >= 75 ? COLORS.warning : COLORS.danger },
                    { header: 'APPA', x: 390, width: 50, key: 'avgAppaScore', format: r => String(r.avgAppaScore) },
                    { header: 'Tickets', x: 445, width: 50, key: 'ticketCount', format: r => String(r.ticketCount) }
                ], data.locationPerformance.slice(0, 20));
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

// ─── Tickets Report PDF ───

const generateTicketsReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Tickets Report', period);

            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Team Responsiveness', 50);
            doc.moveDown(0.8);

            const afterCards = drawStatCards(doc, [
                { label: 'Total Tickets', value: data.responsiveness.totalTickets, color: COLORS.primary },
                { label: 'Avg Response', value: `${data.responsiveness.avgResponseTime}h`, color: COLORS.warning },
                { label: 'Avg Resolution', value: `${data.responsiveness.avgResolutionTime}h`, color: COLORS.success },
                { label: 'Response Rate', value: `${data.responsiveness.responseRate}%`, color: COLORS.primary },
            ], doc.y);
            syncY(doc, afterCards + 10);

            if (data.locationComplaints && data.locationComplaints.length > 0) {
                drawTable(doc, 'Locations with Most Complaints', [
                    { header: 'Location', x: 10, width: 180, key: 'locationName', format: r => r.locationName || 'Unknown' },
                    { header: 'Total', x: 200, width: 60, key: 'totalTickets', format: r => String(r.totalTickets) },
                    { header: 'Open', x: 270, width: 60, key: 'openTickets', format: r => String(r.openTickets), color: () => COLORS.danger },
                    { header: 'Resolved', x: 340, width: 70, key: 'resolvedTickets', format: r => String(r.resolvedTickets), color: () => COLORS.success },
                    { header: 'Avg Response', x: 420, width: 80, key: 'avgResponseTime', format: r => r.avgResponseTime > 0 ? `${r.avgResponseTime}h` : 'N/A' }
                ], data.locationComplaints.slice(0, 20));
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

// ─── Inspector Leaderboard PDF ───

const generateInspectorLeaderboardPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Inspector Leaderboard', period);

            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Summary', 50);
            doc.moveDown(0.8);

            const afterCards = drawStatCards(doc, [
                { label: 'Total Inspectors', value: data.summary.totalInspectors, color: COLORS.primary },
                { label: 'Total Inspections', value: data.summary.totalInspections, color: COLORS.success },
                { label: 'Overall Avg Score', value: `${data.summary.overallAvgScore}%`, color: data.summary.overallAvgScore >= 90 ? COLORS.success : data.summary.overallAvgScore >= 75 ? COLORS.warning : COLORS.danger },
            ], doc.y);
            syncY(doc, afterCards + 10);

            if (data.leaderboard && data.leaderboard.length > 0) {
                const leaderboardWithRank = data.leaderboard.map((item, i) => ({ ...item, rank: i + 1 }));
                drawTable(doc, 'Inspector Rankings', [
                    { header: 'Rank', x: 10, width: 40, key: 'rank', format: r => `#${r.rank}` },
                    { header: 'Inspector', x: 60, width: 180, key: 'inspectorName', format: r => r.inspectorName || 'Unknown' },
                    { header: 'Inspections', x: 250, width: 80, key: 'inspectionCount', format: r => String(r.inspectionCount) },
                    { header: 'Avg Score', x: 340, width: 80, key: 'averageScore', format: r => `${r.averageScore}%`, color: r => r.averageScore >= 90 ? COLORS.success : r.averageScore >= 75 ? COLORS.warning : COLORS.danger },
                    { header: 'APPA', x: 430, width: 60, key: 'avgAppaScore', format: r => String(r.avgAppaScore) }
                ], leaderboardWithRank);
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

// ─── Private Inspections Report PDF ───

const generatePrivateInspectionsReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Private Inspections Report', period);

            doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Summary', 50);
            doc.moveDown(0.8);

            const afterCards = drawStatCards(doc, [
                { label: 'Total Private Inspections', value: data.summary.totalPrivateInspections, color: COLORS.primary },
                { label: 'Average Score', value: `${data.summary.avgScore}%`, color: data.summary.avgScore >= 90 ? COLORS.success : data.summary.avgScore >= 75 ? COLORS.warning : COLORS.danger },
                { label: 'Avg APPA Score', value: data.summary.avgAppaScore, color: COLORS.primary },
            ], doc.y);
            syncY(doc, afterCards + 10);

            if (data.inspectorPerformance && data.inspectorPerformance.length > 0) {
                drawTable(doc, 'Inspector Performance (Internal)', [
                    { header: 'Inspector', x: 10, width: 230, key: 'inspectorName', format: r => r.inspectorName || 'Unknown' },
                    { header: 'Inspections', x: 250, width: 80, key: 'inspectionCount', format: r => String(r.inspectionCount) },
                    { header: 'Avg Score', x: 340, width: 80, key: 'averageScore', format: r => `${r.averageScore}%`, color: r => r.averageScore >= 90 ? COLORS.success : r.averageScore >= 75 ? COLORS.warning : COLORS.danger },
                    { header: 'APPA', x: 430, width: 60, key: 'avgAppaScore', format: r => String(r.avgAppaScore) }
                ], data.inspectorPerformance);
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

// ─── Inspection Forms Report PDF ───

const generateInspectionFormsReportPDF = (data, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const period = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`;
            drawHeader(doc, 'Inspection Forms Report', period);

            if (data.areaTypePerformance && data.areaTypePerformance.length > 0) {
                ensureSpace(doc, 60);
                doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text).text('Area Type Performance', 50, doc.y);
                doc.moveDown(0.8);

                data.areaTypePerformance.forEach((area, areaIdx) => {
                    const itemCount = Math.min(area.lowestPerformingItems?.length || 0, 3);
                    const neededHeight = 30 + itemCount * 18 + 10;
                    ensureSpace(doc, neededHeight);

                    const rowY = doc.y;
                    if (areaIdx % 2 === 0) {
                        doc.rect(50, rowY, CONTENT_WIDTH, 28).fill(COLORS.accent);
                    }

                    const areaName = area.areaType.charAt(0).toUpperCase() + area.areaType.slice(1);
                    doc.fillColor(COLORS.text).fontSize(11).font('Helvetica-Bold')
                        .text(areaName, 60, rowY + 8, { width: 200, lineBreak: false });
                    doc.fillColor(COLORS.secondary).fontSize(10).font('Helvetica')
                        .text(`${area.inspectionCount} inspections`, 270, rowY + 8, { width: 100, lineBreak: false });

                    const scoreColor = area.averageScore >= 90 ? COLORS.success : area.averageScore >= 75 ? COLORS.warning : COLORS.danger;
                    doc.fillColor(scoreColor).fontSize(12).font('Helvetica-Bold')
                        .text(`${area.averageScore}%`, 420, rowY + 8, { width: 80, lineBreak: false });

                    let curY = rowY + 30;

                    if (area.lowestPerformingItems && area.lowestPerformingItems.length > 0) {
                        doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica');
                        area.lowestPerformingItems.slice(0, 3).forEach(item => {
                            if (curY > PAGE_BOTTOM) {
                                doc.addPage();
                                curY = 50;
                            }
                            doc.text(`  \u2022 ${item.itemName}: ${item.failRate}% fail rate`, 70, curY, { width: 430, lineBreak: false });
                            curY += 16;
                        });
                    }

                    syncY(doc, curY + 6);
                });
            }

            if (data.templatePerformance && data.templatePerformance.length > 0) {
                doc.y += 10;
                drawTable(doc, 'Template Performance', [
                    { header: 'Template', x: 10, width: 270, key: 'templateName', format: r => r.templateName || 'Unknown' },
                    { header: 'Inspections', x: 290, width: 100, key: 'inspectionCount', format: r => String(r.inspectionCount) },
                    { header: 'Avg Score', x: 400, width: 90, key: 'averageScore', format: r => `${r.averageScore}%`, color: r => r.averageScore >= 90 ? COLORS.success : r.averageScore >= 75 ? COLORS.warning : COLORS.danger }
                ], data.templatePerformance);
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
