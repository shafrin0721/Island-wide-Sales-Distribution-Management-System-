// =====================================================
// AUTHENTICATION MIDDLEWARE
// Firebase Authentication and JWT Fallback
// =====================================================

const { verifyToken: firebaseVerifyToken, getUserByEmail } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Verify Token Middleware
 * Supports both Firebase tokens and JWT tokens (fallback)
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization header provided'
            });
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Try Firebase first
        try {
            const decodedToken = await firebaseVerifyToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified
            };
            
            // Get user profile from Firestore
            try {
                const userProfile = await getUserByEmail(decodedToken.email);
                if (userProfile) {
                    req.user.role = userProfile.role || 'customer';
                    req.user.displayName = userProfile.displayName;
                    req.user.status = userProfile.status;
                }
            } catch (profileError) {
                console.log('Could not fetch user profile from Firebase:', profileError.message);
                // Continue without profile data
            }
            
            return next();
        } catch (firebaseError) {
            // Firebase failed, try JWT
            console.log('Firebase token verification failed, trying JWT');
        }

        // Fallback to JWT
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
            );
            
            req.user = {
                uid: decoded.uid,
                email: decoded.email,
                displayName: decoded.displayName,
                role: decoded.role || 'customer'
            };

            // Try to get user profile from mock storage
            if (global.mockUsers && global.mockUsers[decoded.email]) {
                const mockUser = global.mockUsers[decoded.email];
                req.user.status = mockUser.status;
                req.user.role = mockUser.role || 'customer';
            }
            
            return next();
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid token'
        });
    }
};

/**
 * Check User Role Middleware
 * Verify user has required role(s)
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Optional Authentication Middleware
 * Does not fail if no token, but attaches user if valid token provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const decodedToken = await firebaseVerifyToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified
            };
            
            // Get user profile from Firestore
            const userProfile = await getUserByEmail(decodedToken.email);
            if (userProfile) {
                req.user.role = userProfile.role || 'customer';
                req.user.displayName = userProfile.displayName;
                req.user.status = userProfile.status;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Admin Only Middleware
 * Restrict access to admin users
 */
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

/**
 * Delivery Partner Only Middleware
 * Restrict access to delivery partners
 */
const deliveryPartnerOnly = (req, res, next) => {
    if (!req.user || (req.user.role !== 'delivery' && req.user.role !== 'admin')) {
        return res.status(403).json({
            success: false,
            message: 'Delivery partner access required'
        });
    }
    next();
};

/**
 * Rate Limiting Middleware
 * Prevent abuse of API endpoints
 */
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const key = `${userId}:${req.path}`;
        const now = Date.now();

        if (!requests.has(key)) {
            requests.set(key, []);
        }

        const userRequests = requests.get(key).filter(time => now - time < windowMs);
        userRequests.push(now);
        requests.set(key, userRequests);

        if (userRequests.length > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later'
            });
        }

        next();
    };
};

/**
 * CORS Preflight Handler
 */
const corsPreflightHandler = (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '3600');
    res.sendStatus(204);
};

/**
 * Request Logging Middleware
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
};

/**
 * Input Validation Middleware
 */
const validateInput = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { 
            abortEarly: false,
            stripUnknown: true 
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        req.validatedData = value;
        next();
    };
};

/**
 * API Key Validation Middleware
 */
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API key'
        });
    }

    next();
};

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('[ERROR]', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 404 Handler Middleware
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
};

module.exports = {
    verifyToken,
    checkRole,
    optionalAuth,
    adminOnly,
    deliveryPartnerOnly,
    rateLimiter,
    corsPreflightHandler,
    requestLogger,
    validateInput,
    validateApiKey,
    errorHandler,
    notFoundHandler
};
