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

dotenv.config();

connectDB();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
