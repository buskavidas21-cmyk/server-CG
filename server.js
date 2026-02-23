const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const templateRoutes = require('./routes/templateRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const v4Routes = require('./routes/v4Routes');

dotenv.config();

connectDB();

// Initialize Notification System (Email + Push channels)
const initializeNotifications = require('./utils/notifications/notificationInit');
initializeNotifications();

// Initialize Reminder Scheduler (daily cron at 8 AM Pacific)
const { initializeScheduler } = require('./utils/notifications/scheduler');
initializeScheduler();

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting - more lenient in development
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests per minute in dev, 100 in production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/' || req.path === '/health';
    }
});
app.use('/api', limiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('CleanGuard QC API is running...');
});

app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/v4', v4Routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
