/**
 * Email Notification Channel
 * 
 * Sends email notifications using Nodemailer via Gmail SMTP.
 * 
 * Required ENV variables:
 *   EMAIL_USER  - Your Gmail address
 *   EMAIL_PASS  - Your Google App Password
 */

const nodemailer = require('nodemailer');
const EMAIL_TEMPLATES = require('../templates/emailTemplates');

class EmailChannel {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    /**
     * Initialize the Gmail SMTP transporter
     */
    initialize() {
        if (this.initialized) return;

        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (!user || !pass) {
            console.warn('⚠️ Email channel: EMAIL_USER or EMAIL_PASS not set in .env — Emails will be logged only.');
            this.initialized = true;
            return;
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
        });

        this.initialized = true;
        console.log(`📧 Email channel initialized (Gmail: ${user})`);
    }

    /**
     * Send notification emails
     */
    async send({ event, recipients, data, meta }) {
        if (!this.initialized) {
            this.initialize();
        }

        const templateFn = EMAIL_TEMPLATES[event.key];
        if (!templateFn) {
            console.warn(`⚠️ No email template for event: ${event.key}`);
            return { skipped: true, reason: 'No template' };
        }

        const { subject, html } = templateFn(data);

        // Filter: must have email AND notifications.email not explicitly false
        const validRecipients = recipients.filter(r => r.email && r.notificationEmail !== false);
        if (validRecipients.length === 0) {
            return { skipped: true, reason: 'No valid email recipients' };
        }

        const fromEmail = process.env.EMAIL_USER;
        const results = [];

        for (const recipient of validRecipients) {
            try {
                const mailOptions = {
                    from: `"CleanGuard QC" <${fromEmail}>`,
                    to: recipient.email,
                    subject,
                    html,
                };

                if (this.transporter) {
                    const info = await this.transporter.sendMail(mailOptions);
                    results.push({
                        email: recipient.email,
                        success: true,
                        messageId: info.messageId,
                    });
                    console.log(`📧 Email sent to ${recipient.email}: ${subject}`);
                } else {
                    console.log(`📧 [DEV] Email would be sent to ${recipient.email}: ${subject}`);
                    results.push({
                        email: recipient.email,
                        success: true,
                        dev: true,
                        message: 'Logged (EMAIL_USER/EMAIL_PASS not configured)',
                    });
                }
            } catch (error) {
                console.error(`❌ Failed to send email to ${recipient.email}:`, error.message);
                results.push({
                    email: recipient.email,
                    success: false,
                    error: error.message,
                });
            }
        }

        return { sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, details: results };
    }

    /**
     * Verify SMTP connection
     */
    async verify() {
        if (!this.initialized) this.initialize();
        if (!this.transporter) return { connected: false, reason: 'No transporter (EMAIL_USER/EMAIL_PASS not set)' };

        try {
            await this.transporter.verify();
            return { connected: true };
        } catch (error) {
            return { connected: false, reason: error.message };
        }
    }
}

module.exports = new EmailChannel();
