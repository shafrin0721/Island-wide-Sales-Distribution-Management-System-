// =====================================================
// INVOICE SERVICE
// PDF Invoice Generation and Email
// =====================================================

const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

/**
 * Generate PDF Invoice
 * @param {Object} orderData - Order details
 * @param {Array} orderItems - Order items
 * @param {Object} customerData - Customer details
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateInvoicePDF(orderData, orderItems, customerData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Header with company info
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text('INVOICE', { align: 'center' })
                .fontSize(10);

            // Company info
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text('RDC Management System', 50, 80)
                .fontSize(9)
                .font('Helvetica')
                .text('123 Business Street', 50, 100)
                .text('Jakarta, Indonesia 12345', 50, 115)
                .text('Phone: +62 123 456 789', 50, 130)
                .text('Email: info@rdc.com', 50, 145);

            // Invoice details
            const rightX = 400;
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text('Invoice Number:', rightX, 80)
                .font('Helvetica')
                .text(orderData.order_number, rightX + 120, 80);

            doc.font('Helvetica-Bold')
                .text('Invoice Date:', rightX, 100)
                .font('Helvetica')
                .text(new Date(orderData.created_at).toLocaleDateString('en-US'), rightX + 120, 100);

            doc.font('Helvetica-Bold')
                .text('Due Date:', rightX, 120)
                .font('Helvetica')
                .text(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'), rightX + 120, 120);

            // Bill to section
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text('BILL TO:', 50, 180)
                .fontSize(10)
                .font('Helvetica')
                .text(customerData.full_name, 50, 200)
                .text(customerData.address || 'N/A', 50, 215)
                .text(`${customerData.city}, ${customerData.country} ${customerData.postal_code}`, 50, 230)
                .text(`Email: ${customerData.email}`, 50, 245)
                .text(`Phone: ${customerData.phone}`, 50, 260);

            // Table header
            const tableTop = 310;
            const col1 = 50;
            const col2 = 200;
            const col3 = 320;
            const col4 = 420;

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .rect(col1, tableTop, 500, 20)
                .fill('#f0f0f0')
                .fillColor('#000000');

            doc.text('Product', col1 + 5, tableTop + 5)
                .text('Qty', col2 + 5, tableTop + 5)
                .text('Unit Price', col3 + 5, tableTop + 5)
                .text('Amount', col4 + 5, tableTop + 5);

            // Table body
            let yPosition = tableTop + 25;
            let itemTotal = 0;

            doc.font('Helvetica')
                .fontSize(9);

            orderItems.forEach(item => {
                const lineTotal = item.unit_price * item.quantity;
                itemTotal += lineTotal;

                doc.text(item.product_name || `Product ${item.product_id}`, col1 + 5, yPosition, { width: 140, ellipsis: true })
                    .text(item.quantity.toString(), col2 + 5, yPosition)
                    .text(`$${item.unit_price.toFixed(2)}`, col3 + 5, yPosition)
                    .text(`$${lineTotal.toFixed(2)}`, col4 + 5, yPosition);

                yPosition += 20;
            });

            // Summary section
            const summaryY = yPosition + 20;
            doc.fontSize(10)
                .font('Helvetica')
                .text('Subtotal:', col3, summaryY)
                .text(`$${orderData.subtotal.toFixed(2)}`, col4, summaryY);

            doc.text('Tax (10%):', col3, summaryY + 20)
                .text(`$${orderData.tax_amount.toFixed(2)}`, col4, summaryY + 20);

            doc.font('Helvetica-Bold')
                .fontSize(12)
                .text('TOTAL:', col3, summaryY + 45)
                .text(`$${orderData.total_amount.toFixed(2)}`, col4, summaryY + 45);

            // Payment status
            const paymentY = summaryY + 80;
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .text('Payment Status:', 50, paymentY)
                .font('Helvetica')
                .text(orderData.payment_status || 'Pending', 50, paymentY + 15);

            // Delivery info
            doc.font('Helvetica-Bold')
                .text('Estimated Delivery:', 50, paymentY + 35)
                .font('Helvetica')
                .text(new Date(orderData.estimated_delivery_date).toLocaleDateString('en-US'), 50, paymentY + 50);

            // Footer
            doc.fontSize(8)
                .text('Thank you for your business!', 50, 750, { align: 'center' })
                .text('For inquiries, contact support@rdc.com', 50, 765, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Send invoice via email
 * @param {string} email - Customer email
 * @param {Object} orderData - Order details
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Promise<Object>} Email send result
 */
async function sendInvoiceEmail(email, orderData, pdfBuffer) {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@rdc.com',
            to: email,
            subject: `Invoice ${orderData.order_number} - RDC Management System`,
            html: `
                <h2>Invoice Confirmation</h2>
                <p>Dear Customer,</p>
                <p>Thank you for your order! Your invoice is attached below.</p>
                <p><strong>Order Number:</strong> ${orderData.order_number}</p>
                <p><strong>Order Date:</strong> ${new Date(orderData.created_at).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(orderData.estimated_delivery_date).toLocaleDateString()}</p>
                <p>Your invoice is attached to this email for your records.</p>
                <p>Best regards,<br>RDC Management System</p>
            `,
            attachments: [
                {
                    filename: `Invoice_${orderData.order_number}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        const result = await transporter.sendMail(mailOptions);
        return {
            success: true,
            message: 'Invoice sent successfully',
            messageId: result.messageId
        };
    } catch (error) {
        console.error('Send invoice email error:', error);
        return {
            success: false,
            message: 'Failed to send invoice email',
            error: error.message
        };
    }
}

/**
 * Generate and send invoice for an order
 * @param {Object} orderData - Order details
 * @param {Array} orderItems - Order line items
 * @param {Object} customerData - Customer information
 * @param {boolean} sendEmail - Whether to send email
 * @returns {Promise<Object>} Result object
 */
async function generateAndSendInvoice(orderData, orderItems, customerData, sendEmail = true) {
    try {
        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(orderData, orderItems, customerData);

        // Save PDF locally if needed
        const invoiceDir = path.join(process.cwd(), 'invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true });
        }

        const filename = `Invoice_${orderData.order_number}_${Date.now()}.pdf`;
        const filepath = path.join(invoiceDir, filename);
        fs.writeFileSync(filepath, pdfBuffer);

        // Send email if requested
        let emailResult = { success: true, message: 'Email not sent' };
        if (sendEmail && customerData.email) {
            emailResult = await sendInvoiceEmail(customerData.email, orderData, pdfBuffer);
        }

        return {
            success: true,
            message: 'Invoice generated successfully',
            data: {
                invoiceFile: filename,
                filepath: filepath,
                pdfBuffer: pdfBuffer.toString('base64'),
                emailSent: emailResult.success
            }
        };
    } catch (error) {
        console.error('Generate and send invoice error:', error);
        return {
            success: false,
            message: 'Failed to generate invoice',
            error: error.message
        };
    }
}

module.exports = {
    generateInvoicePDF,
    sendInvoiceEmail,
    generateAndSendInvoice,
    transporter
};
