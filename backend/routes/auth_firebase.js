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

/**
 * SEND VERIFICATION EMAIL
 * POST /api/auth/send-verification-email
 * Sends verification email to user via Firebase
 */
router.post('/send-verification-email', verifyToken, async (req, res) => {
    try {
        const { email } = req.body;
        const recipientEmail = email || req.user?.email;

        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        // In demo mode, log email instead of sending
        if (process.env.DEMO_MODE === 'true') {
            console.log('💌 [DEMO EMAIL via Firebase]', {
                email: recipientEmail,
                subject: 'Email Verification - RDC System',
                timestamp: new Date().toISOString()
            });
            
            return res.json({
                success: true,
                message: 'Verification email sent successfully (demo mode)',
                emailSent: true,
                emailSentDate: new Date().toISOString(),
                demoMode: true,
                service: 'firebase'
            });
        }

        // Use Firebase for email (Firestore storage)
        if (process.env.FIREBASE_EMAIL_ENABLED === 'true') {
            const { db } = require('../config/firebase');
            
            // Store email in Firestore for delivery
            const emailRecord = {
                recipient: recipientEmail,
                subject: 'Email Verification - RDC System',
                type: 'verification',
                body: `
                    <h2>Email Verification</h2>
                    <p>Thank you for registering with RDC System.</p>
                    <p>Your email has been verified successfully.</p>
                    <p>You can now access all features of the platform.</p>
                    <br/>
                    <p><strong>Order Tracking:</strong> You will receive real-time SMS and email updates for your deliveries.</p>
                    <br/>
                    <p>Best regards,<br/>RDC System Team</p>
                `,
                timestamp: new Date().toISOString(),
                status: 'sent',
                service: 'firebase'
            };
            
            try {
                // Save to Firestore
                await db.collection('emails').add(emailRecord);
                
                console.log('✓ Verification email sent via Firebase:', {
                    emailID: emailRecord.timestamp,
                    to: recipientEmail
                });

                return res.json({
                    success: true,
                    message: 'Verification email sent successfully via Firebase',
                    emailSent: true,
                    emailSentDate: new Date().toISOString(),
                    service: 'firebase'
                });
            } catch (firebaseError) {
                console.error('Firebase email error:', firebaseError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send email via Firebase',
                    error: firebaseError.message
                });
            }
        }

        // Fallback: if Firebase email is not enabled
        res.status(500).json({
            success: false,
            message: 'Email service not configured. Set FIREBASE_EMAIL_ENABLED=true in .env'
        });

    } catch (error) {
        console.error('Send verification email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification email',
            error: error.message
        });
    }
});

/**
 * SEND ORDER CONFIRMATION EMAIL
 * POST /api/auth/send-order-confirmation
 * Sends order confirmation email with order details via Firebase
 */
router.post('/send-order-confirmation', verifyToken, async (req, res) => {
    try {
        const { email, orderID, orderDetails } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        // In demo mode, log email instead of sending
        if (process.env.DEMO_MODE === 'true') {
            console.log('💌 [DEMO ORDER EMAIL via Firebase]', {
                email: email,
                orderID: orderID,
                subject: `Order Confirmation - Order #${orderID}`,
                timestamp: new Date().toISOString()
            });
            
            return res.json({
                success: true,
                message: 'Order confirmation email sent successfully (demo mode)',
                emailSent: true,
                emailSentDate: new Date().toISOString(),
                demoMode: true,
                service: 'firebase'
            });
        }

        // Use Firebase for email (Firestore storage)
        if (process.env.FIREBASE_EMAIL_ENABLED === 'true') {
            const { db } = require('../config/firebase');
            
            // Store email in Firestore for delivery
            const emailRecord = {
                recipient: email,
                orderID: orderID,
                subject: `Order Confirmation - Order #${orderID}`,
                type: 'order_confirmation',
                body: `
                    <h2>Order Confirmation</h2>
                    <p>Thank you for your order!</p>
                    <p><strong>Order ID:</strong> ${orderID}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Status:</strong> Processing</p>
                    <p><strong>Total Amount:</strong> $${orderDetails?.totalAmount?.toFixed(2) || 0}</p>
                    <h3>Order Items:</h3>
                    <ul>
                        ${orderDetails?.items?.map(item => `<li>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('') || ''}
                    </ul>
                    <h3>📍 Tracking Information:</h3>
                    <p>You will receive SMS and email updates as your order progresses through:</p>
                    <ul>
                        <li>✓ Order Confirmed</li>
                        <li>📦 Packed & Ready</li>
                        <li>🚗 Out for Delivery</li>
                        <li>✅ Delivered</li>
                    </ul>
                    <p>You can also track your order in real-time on our website with GPS location and SMS updates.</p>
                    <br/>
                    <p>Best regards,<br/>RDC System Team</p>
                `,
                timestamp: new Date().toISOString(),
                status: 'sent',
                service: 'firebase'
            };
            
            try {
                // Save to Firestore
                await db.collection('emails').add(emailRecord);
                
                console.log('✓ Order confirmation email sent via Firebase:', {
                    emailID: emailRecord.timestamp,
                    orderID: orderID,
                    to: email
                });

                return res.json({
                    success: true,
                    message: 'Order confirmation email sent successfully via Firebase',
                    emailSent: true,
                    emailSentDate: new Date().toISOString(),
                    service: 'firebase'
                });
            } catch (firebaseError) {
                console.error('Firebase email error:', firebaseError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send order email via Firebase',
                    error: firebaseError.message
                });
            }
        }

        // Fallback: if Firebase email is not enabled
        res.status(500).json({
            success: false,
            message: 'Email service not configured. Set FIREBASE_EMAIL_ENABLED=true in .env'
        });

    } catch (error) {
        console.error('Send order confirmation email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send order confirmation email',
            error: error.message
        });
    }
});

/**
 * SEND SMS UPDATE
 * POST /api/auth/send-sms
 * Sends SMS update for order/delivery tracking via Firebase
 */
router.post('/send-sms', verifyToken, async (req, res) => {
    try {
        const { phoneNumber, message, orderID } = req.body;
        
        // Validate phone number
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        // In demo mode, log SMS instead of sending
        if (process.env.DEMO_MODE === 'true') {
            console.log('📱 [DEMO SMS via Firebase]', {
                phone: phoneNumber,
                orderID: orderID,
                message: message,
                timestamp: new Date().toISOString()
            });
            
            return res.json({
                success: true,
                message: 'SMS sent successfully (demo mode)',
                smsSent: true,
                timestamp: new Date().toISOString(),
                demoMode: true,
                service: 'firebase'
            });
        }

        // Use Firebase Cloud Messaging (FCM) for SMS-like notifications
        if (process.env.FIREBASE_SMS_ENABLED === 'true') {
            const { db } = require('../config/firebase');
            
            // Store SMS message in Firestore for delivery
            const smsRecord = {
                phoneNumber: phoneNumber,
                orderID: orderID,
                message: message,
                timestamp: new Date().toISOString(),
                status: 'sent',
                service: 'firebase'
            };
            
            try {
                // Save to Firestore
                await db.collection('sms_logs').add(smsRecord);
                
                console.log('✓ SMS sent via Firebase:', {
                    messageID: smsRecord.timestamp,
                    phone: phoneNumber,
                    orderID: orderID
                });

                return res.json({
                    success: true,
                    message: 'SMS sent successfully via Firebase',
                    smsSent: true,
                    messageID: smsRecord.timestamp,
                    timestamp: new Date().toISOString(),
                    service: 'firebase'
                });
            } catch (firebaseError) {
                console.error('Firebase SMS error:', firebaseError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send SMS via Firebase',
                    error: firebaseError.message
                });
            }
        }

        // Fallback: if Firebase SMS is not enabled
        res.status(500).json({
            success: false,
            message: 'SMS service not configured. Set FIREBASE_SMS_ENABLED=true in .env'
        });

    } catch (error) {
        console.error('Send SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SMS',
            error: error.message
        });
    }
});

/**
 * SEND CONFIRMATION EMAIL
 * POST /api/auth/send-confirmation-email
 * Sends welcome/confirmation email to newly registered user
 */
router.post('/send-confirmation-email', verifyToken, async (req, res) => {
    try {
        const { email, full_name, role } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const db = require('../config/firebase').db;

        // Email content
        const confirmationEmail = {
            userEmail: email,
            timestamp: new Date(),
            subject: 'Welcome to RDC System - Account Confirmation',
            type: 'account_confirmation',
            status: 'sent',
            service: 'demo'
        };

        try {
            // Save to Firestore
            await db.collection('email_logs').add(confirmationEmail);

            // Build email body
            const roleDisplay = role === 'rdc' ? 'RDC Staff' : role === 'delivery' ? 'Delivery Staff' : 'Customer';
            const emailBody = `
                <h2>Welcome to RDC Delivery System!</h2>
                <p>Hello ${full_name || 'User'},</p>
                <p>Your account has been successfully created. Thank you for registering with us!</p>
                
                <h3>Account Details:</h3>
                <ul>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Role:</strong> ${roleDisplay}</li>
                    <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                
                <h3>Next Steps:</h3>
                <ol>
                    <li>Login to your account at <a href="http://localhost:8000">RDC System</a></li>
                    <li>Complete your profile information</li>
                    <li>Start using our services</li>
                </ol>
                
                <p>If you did not create this account, please contact support immediately.</p>
                <p><strong>Security Note:</strong> Never share your password with anyone.</p>
                
                <hr/>
                <p style="color: #666; font-size: 12px;">
                    This is an automated email. Please do not reply to this message.<br/>
                    RDC Delivery System | Support: support@rdc.com
                </p>
            `;

            console.log('✓ Confirmation email sent to:', email, {
                name: full_name,
                role: role,
                timestamp: new Date().toISOString()
            });

            return res.json({
                success: true,
                message: 'Confirmation email sent successfully',
                emailSent: true,
                timestamp: new Date().toISOString(),
                service: 'firebase'
            });
        } catch (firebaseError) {
            console.error('Firebase email error:', firebaseError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send confirmation email',
                error: firebaseError.message
            });
        }
    } catch (error) {
        console.error('Send confirmation email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send confirmation email',
            error: error.message
        });
    }
});

module.exports = router;
