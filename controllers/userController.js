const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const notificationService = require('../utils/notifications/notificationService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    try {
        const { email, password, fcmToken } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // If mobile app sends fcmToken on login, save it
            if (fcmToken && fcmToken !== user.fcmToken) {
                user.fcmToken = fcmToken;
                await user.save();
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                assignedLocations: user.assignedLocations,
                notifications: user.notifications,
                fcmToken: user.fcmToken,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public (or Admin only depending on requirements, making it public for initial setup)
const registerUser = async (req, res) => {
    const { name, email, password, role, notifications, fcmToken } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const userData = { name, email, password, role };
    if (notifications) userData.notifications = notifications;
    if (fcmToken) userData.fcmToken = fcmToken;

    const user = await User.create(userData);

    if (user) {
        // ─── Send Welcome Email (non-blocking) ─────────────────
        (async () => {
            try {
                await notificationService.notify('USER_WELCOME', {
                    recipients: [{ userId: user._id.toString(), email: user.email, name: user.name, role: user.role }],
                    data: {
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        tempPassword: password, // Send the initial password
                    },
                });
            } catch (err) {
                console.error('Notification error (user welcome):', err.message);
            }
        })();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            notifications: user.notifications,
            fcmToken: user.fcmToken,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Logout user / clear token
// @route   POST /api/users/logout  
// @access  Private
const logoutUser = async (req, res) => {
    try {
        // In a production app with refresh tokens stored in DB, you'd invalidate them here
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Refresh access token
// @route   POST /api/users/refresh
// @access  Public (but requires valid refresh token)
const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Generate new token
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            notifications: user.notifications,
            fcmToken: user.fcmToken,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: error.message });
    }
};



// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Track changes for notification
        const changes = {};
        if (req.body.name && req.body.name !== user.name) changes.Name = req.body.name;
        if (req.body.email && req.body.email !== user.email) changes.Email = req.body.email;
        if (req.body.role && req.body.role !== user.role) changes.Role = req.body.role.replace('_', ' ');
        if (req.body.assignedLocations) changes['Assigned Locations'] = 'Updated';
        if (req.body.password) changes.Password = 'Changed';

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        if (req.body.assignedLocations) {
            user.assignedLocations = req.body.assignedLocations;
        }
        if (req.body.password) {
            user.password = req.body.password;
        }
        if (req.body.notifications !== undefined) {
            if (req.body.notifications.email !== undefined) {
                user.notifications.email = req.body.notifications.email;
            }
            if (req.body.notifications.push !== undefined) {
                user.notifications.push = req.body.notifications.push;
            }
        }
        if (req.body.fcmToken !== undefined) {
            user.fcmToken = req.body.fcmToken;
        }

        const updatedUser = await user.save();

        // ─── Send Update Notification (non-blocking) ────────────
        if (Object.keys(changes).length > 0) {
            (async () => {
                try {
                    await notificationService.notify('USER_UPDATED', {
                        recipients: [{ userId: updatedUser._id.toString(), email: updatedUser.email, name: updatedUser.name, role: updatedUser.role }],
                        data: {
                            name: updatedUser.name,
                            changes,
                        },
                    });
                } catch (err) {
                    console.error('Notification error (user updated):', err.message);
                }
            })();
        }

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            notifications: updatedUser.notifications,
            fcmToken: updatedUser.fcmToken,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

module.exports = { authUser, registerUser, logoutUser, refreshToken, getUsers, updateUser, deleteUser };
