// =====================================================
// NOTIFICATION SERVICES
// Email (Nodemailer) and SMS (Twilio)
// =====================================================

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { query } = require('../config/database');

/**
 * EMAIL SERVICE using Nodemailer
 */
const emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Send Email
 */
const sendEmail = async (to, subject, htmlContent, textContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html: htmlContent,
            text: textContent
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send Order Confirmation Email
 */
const sendOrderConfirmationEmail = async (userId, orderData) => {
    try {
        const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return;

        const user = userResult.rows[0];
        const itemsHtml = orderData.items.map(item => 
            `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price}</td></tr>`
        ).join('');

        const htmlContent = `
            <h2>Order Confirmation</h2>
            <p>Hi ${user.full_name},</p>
            <p>Thank you for your order! Order #${orderData.order_number}</p>
            <table border="1">
                <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
                ${itemsHtml}
            </table>
            <p><strong>Total: $${orderData.total_amount}</strong></p>
            <p>Your order will be delivered to:</p>
            <p>${orderData.delivery_address}</p>
            <p>Best regards,<br/>RDC Management System</p>
        `;

        return await sendEmail(user.email, 'Order Confirmation', htmlContent, 
            `Order confirmation for #${orderData.order_number}`);
    } catch (error) {
        console.error('Order confirmation email error:', error);
    }
};

/**
 * Send Delivery Status Update Email
 */
const sendDeliveryStatusEmail = async (userId, deliveryData) => {
    try {
        const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return;

        const user = userResult.rows[0];
        const statusMessages = {
            'pending': 'Your order is being prepared for shipment',
            'in_transit': 'Your order is on the way!',
            'delivered': 'Your order has been delivered',
            'failed': 'There was an issue with your delivery'
        };

        const htmlContent = `
            <h2>Delivery Update</h2>
            <p>Hi ${user.full_name},</p>
            <p>${statusMessages[deliveryData.status] || 'Status update on your delivery'}</p>
            <p><strong>Status:</strong> ${deliveryData.status.toUpperCase()}</p>
            <p><strong>Delivery #:</strong> ${deliveryData.delivery_number}</p>
            ${deliveryData.gps_latitude ? `<p><strong>Current Location:</strong> ${deliveryData.gps_latitude}, ${deliveryData.gps_longitude}</p>` : ''}
            <p>Best regards,<br/>RDC Management System</p>
        `;

        return await sendEmail(user.email, 'Delivery Status Update', htmlContent, 
            `Your delivery status: ${deliveryData.status}`);
    } catch (error) {
        console.error('Delivery status email error:', error);
    }
};

/**
 * SMS SERVICE using Twilio
 */
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS
 */
const sendSMS = async (phoneNumber, message) => {
    try {
        const sms = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        console.log('SMS sent:', sms.sid);
        return { success: true, messageSid: sms.sid };
    } catch (error) {
        console.error('SMS send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send Order Confirmation SMS
 */
const sendOrderConfirmationSMS = async (phoneNumber, orderData) => {
    const message = `Order confirmed! #${orderData.order_number}. Total: $${orderData.total_amount}. Track: ${process.env.FRONTEND_URL}/orders/${orderData.order_id}`;
    return await sendSMS(phoneNumber, message);
};

/**
 * Send Delivery Update SMS
 */
const sendDeliveryUpdateSMS = async (phoneNumber, deliveryData) => {
    const messages = {
        'in_transit': `Your order is on the way! Delivery #${deliveryData.delivery_number}. Track live: ${process.env.FRONTEND_URL}/track/${deliveryData.order_id}`,
        'delivered': `Your order has been delivered! Thank you for your purchase.`,
        'failed': `Delivery attempt failed. Please contact support for details.`
    };

    const message = messages[deliveryData.status] || `Delivery status update: ${deliveryData.status}`;
    return await sendSMS(phoneNumber, message);
};

/**
 * Log Notification in Database
 */
const logNotification = async (userId, type, channel, message, data = {}) => {
    try {
        const user = await query('SELECT email, phone FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) return;

        await query(
            `INSERT INTO notifications (user_id, notification_type, channel, recipient_email, 
                                       recipient_phone, message, data, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent')`,
            [userId, type, channel, user.rows[0].email, user.rows[0].phone, 
             message, JSON.stringify(data)]
        );
    } catch (error) {
        console.error('Log notification error:', error);
    }
};

/**
 * Send Notification (Email + SMS based on preferences)
 */
const sendNotification = async (userId, type, data) => {
    try {
        // Get user preferences
        const prefResult = await query(
            'SELECT notification_email_enabled, notification_sms_enabled FROM user_preferences WHERE user_id = $1',
            [userId]
        );

        if (prefResult.rows.length === 0) return;

        const prefs = prefResult.rows[0];
        const userResult = await query(
            'SELECT email, phone, full_name FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) return;

        const user = userResult.rows[0];

        // Send based on type
        switch (type) {
            case 'order_confirmation':
                if (prefs.notification_email_enabled) {
                    await sendOrderConfirmationEmail(userId, data);
                }
                if (prefs.notification_sms_enabled && user.phone) {
                    await sendOrderConfirmationSMS(user.phone, data);
                }
                break;

            case 'delivery_update':
                if (prefs.notification_email_enabled) {
                    await sendDeliveryStatusEmail(userId, data);
                }
                if (prefs.notification_sms_enabled && user.phone) {
                    await sendDeliveryUpdateSMS(user.phone, data);
                }
                break;

            case 'payment_confirmation':
                if (prefs.notification_email_enabled) {
                    const htmlContent = `
                        <h2>Payment Received</h2>
                        <p>Hi ${user.full_name},</p>
                        <p>Your payment of $${data.amount} has been received successfully.</p>
                        <p><strong>Transaction ID:</strong> ${data.transaction_id}</p>
                        <p>Best regards,<br/>RDC Management System</p>
                    `;
                    await sendEmail(user.email, 'Payment Confirmation', htmlContent, 
                        `Payment confirmed: $${data.amount}`);
                }
                break;

            case 'promotional':
                if (prefs.notification_email_enabled) {
                    await sendEmail(user.email, data.subject, data.htmlContent, data.textContent);
                }
                break;
        }

        // Log notification
        await logNotification(userId, type, 'multi', data.message || '', data);

    } catch (error) {
        console.error('Send notification error:', error);
    }
};

/**
 * Get Notification History
 */
const getNotificationHistory = async (userId, limit = 20) => {
    try {
        const result = await query(
            `SELECT id, notification_type, channel, message, status, created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        return result.rows;
    } catch (error) {
        console.error('Get notification history error:', error);
        return [];
    }
};

module.exports = {
    sendEmail,
    sendSMS,
    sendOrderConfirmationEmail,
    sendOrderConfirmationSMS,
    sendDeliveryStatusEmail,
    sendDeliveryUpdateSMS,
    sendNotification,
    logNotification,
    getNotificationHistory
};
