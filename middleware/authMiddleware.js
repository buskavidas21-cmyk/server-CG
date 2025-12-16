const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as admin');
    }
};

const adminOrSubAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sub_admin')) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as admin or sub-admin');
    }
};

const adminOrSubAdminOrSupervisor = (req, res, next) => {
    if (req.user && (['admin', 'sub_admin', 'supervisor'].includes(req.user.role))) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized');
    }
};

module.exports = { protect, admin, adminOrSubAdmin, adminOrSubAdminOrSupervisor };
