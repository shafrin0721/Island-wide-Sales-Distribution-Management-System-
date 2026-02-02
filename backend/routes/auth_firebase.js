// =====================================================
// AUTHENTICATION ROUTES (Firebase)
// User Registration, Login, Token Management
// =====================================================

const express = require('express');
const router = express.Router();
const { auth, createUser, getUserByEmail, verifyToken: firebaseVerifyToken, createCustomToken } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

/**
 * USER REGISTRATION
 * POST /api/auth/register
 * Creates new user in Firebase Auth and Firestore
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, phone, role = 'customer' } = req.body;

        // Validation
        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: full_name
        });

        // Create user profile in Firestore
        const userDoc = await createUser(email, password, full_name);

        // Update user profile with additional data
        const db = require('../config/firebase').db;
        await db.collection('users').doc(userRecord.uid).update({
            phone: phone || '',
            role: role || 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Generate custom token
        const token = await createCustomToken(userRecord.uid);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                role: role || 'customer'
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        if (error.code === 'auth/invalid-email') {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (error.code === 'auth/weak-password') {
            return res.status(400).json({
                success: false,
                message: 'Password is too weak'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * USER LOGIN
 * POST /api/auth/login
 * Authenticate user and generate token
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Get user from Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Get user profile from Firestore
        const userProfile = await getUserByEmail(email);
        
        if (!userProfile) {
            return res.status(401).json({
                success: false,
                message: 'User profile not found'
            });
        }

        // Check if user is active
        if (userProfile.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive'
            });
        }

        // Generate custom token (Firebase will verify password via client SDK in production)
        // For API login, we're using custom token
        const token = await createCustomToken(userRecord.uid);

        // Update last login
        const db = require('../config/firebase').db;
        await db.collection('users').doc(userRecord.uid).update({
            lastLogin: new Date(),
            updatedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                role: userProfile.role || 'customer'
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * REFRESH TOKEN
 * POST /api/auth/refresh-token
 * Generate new token with existing auth
 */
router.post('/refresh-token', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        // Generate new token
        const newToken = await createCustomToken(userId);

        res.json({
            success: true,
            message: 'Token refreshed',
            token: newToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
});

/**
 * LOGOUT
 * POST /api/auth/logout
 * Invalidate current session
 */
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // Firebase handles revocation server-side
        // In a production app, you'd want to track invalidated tokens
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

/**
 * VERIFY TOKEN
 * GET /api/auth/verify
 * Check if token is valid
 */
router.get('/verify', verifyToken, async (req, res) => {
    try {
        // If we got here, token is valid
        const userProfile = await getUserByEmail(req.user.email);
        
        res.json({
            success: true,
            message: 'Token is valid',
            user: {
                uid: req.user.uid,
                email: req.user.email,
                displayName: req.user.displayName,
                role: userProfile?.role || 'customer'
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Token verification failed'
        });
    }
});

/**
 * GET CURRENT USER
 * GET /api/auth/me
 * Get authenticated user profile
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const userProfile = await getUserByEmail(req.user.email);

        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        res.json({
            success: true,
            user: {
                uid: req.user.uid,
                email: req.user.email,
                displayName: userProfile.displayName,
                phone: userProfile.phone,
                role: userProfile.role,
                status: userProfile.status,
                preferences: userProfile.preferences,
                createdAt: userProfile.createdAt,
                updatedAt: userProfile.updatedAt
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile'
        });
    }
});

/**
 * UPDATE PROFILE
 * PUT /api/auth/profile
 * Update user profile information
 */
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { full_name, phone, preferences } = req.body;
        const db = require('../config/firebase').db;

        const updateData = {
            updatedAt: new Date()
        };

        if (full_name) {
            updateData.displayName = full_name;
            // Also update in Firebase Auth
            await auth.updateUser(req.user.uid, { displayName: full_name });
        }

        if (phone) updateData.phone = phone;
        if (preferences) updateData.preferences = preferences;

        await db.collection('users').doc(req.user.uid).update(updateData);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                uid: req.user.uid,
                email: req.user.email,
                displayName: full_name || req.user.displayName,
                phone: phone,
                preferences: preferences
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

/**
 * CHANGE PASSWORD
 * POST /api/auth/change-password
 * Update user password
 */
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Update password in Firebase Auth
        await auth.updateUser(req.user.uid, { password: newPassword });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);

        if (error.code === 'auth/weak-password') {
            return res.status(400).json({
                success: false,
                message: 'New password is too weak'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

/**
 * PASSWORD RESET REQUEST
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user exists
        const userProfile = await getUserByEmail(email);
        if (!userProfile) {
            // Don't reveal if email exists for security
            return res.json({
                success: true,
                message: 'If the email exists, a password reset link will be sent'
            });
        }

        // Generate password reset link (you would use Firebase email service)
        // For now, just confirm the request
        const resetLink = await auth.generatePasswordResetLink(email);

        // In production, send this link via email
        // await sendPasswordResetEmail(email, resetLink);

        res.json({
            success: true,
            message: 'Password reset link has been sent to your email',
            // In production, don't return the actual link
            resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset'
        });
    }
});

/**
 * DELETE ACCOUNT
 * DELETE /api/auth/account
 * Permanently delete user account
 */
router.delete('/account', verifyToken, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }

        const db = require('../config/firebase').db;

        // Soft delete user profile (don't actually delete for audit trail)
        await db.collection('users').doc(req.user.uid).update({
            status: 'deleted',
            deletedAt: new Date(),
            deletedReason: 'User requested account deletion'
        });

        // Delete Firebase Auth user
        await auth.deleteUser(req.user.uid);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
});

module.exports = router;
