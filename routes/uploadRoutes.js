const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload single photo
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.json({
            message: 'Photo uploaded successfully',
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`,
            url: `http://localhost:5000/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Upload multiple photos
// @route   POST /api/upload/multiple
// @access  Private
router.post('/multiple', protect, upload.array('photos', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const files = req.files.map(file => ({
            filename: file.filename,
            path: `/uploads/${file.filename}`,
            url: `http://localhost:5000/uploads/${file.filename}`
        }));

        res.json({
            message: 'Photos uploaded successfully',
            files
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
