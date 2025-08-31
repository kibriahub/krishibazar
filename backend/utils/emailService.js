const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email for registration
const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"KrishiBazar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - KrishiBazar Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; margin: 0;">KrishiBazar</h1>
            <p style="color: #666; margin: 5px 0;">Your Trusted Agricultural Marketplace</p>
          </div>
          
          <h2 style="color: #333; text-align: center;">Email Verification Required</h2>
          
          <p style="color: #555; font-size: 16px;">Hello ${name},</p>
          
          <p style="color: #555; font-size: 16px;">Thank you for registering with KrishiBazar! To complete your registration, please verify your email address using the OTP below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #f8f9fa; border: 2px dashed #28a745; border-radius: 10px; padding: 20px; display: inline-block;">
              <h1 style="color: #28a745; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
            </div>
          </div>
          
          <p style="color: #555; font-size: 16px;">This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
          
          <p style="color: #555; font-size: 16px;">If you didn't request this verification, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center; color: #888; font-size: 14px;">
            <p>Best regards,<br>The KrishiBazar Team</p>
            <p style="margin-top: 20px;">© 2024 KrishiBazar. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, orderData) => {
  try {
    const transporter = createTransporter();
    
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">৳${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    
    const mailOptions = {
      from: `"KrishiBazar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation - ${orderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; margin: 0;">KrishiBazar</h1>
            <p style="color: #666; margin: 5px 0;">Your Trusted Agricultural Marketplace</p>
          </div>
          
          <h2 style="color: #333; text-align: center;">Order Confirmation</h2>
          
          <p style="color: #555; font-size: 16px;">Hello ${orderData.customerName},</p>
          
          <p style="color: #555; font-size: 16px;">Thank you for your order! We've received your order and it's being processed.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Order Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
            <p><strong>Status:</strong> ${orderData.status}</p>
          </div>
          
          <h3 style="color: #333;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f8f9fa;">
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #dee2e6;">Total Amount:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #dee2e6;">৳${orderData.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Delivery Address</h3>
            <p style="margin: 5px 0;"><strong>${orderData.deliveryAddress.fullName}</strong></p>
            <p style="margin: 5px 0;">${orderData.deliveryAddress.address}</p>
            <p style="margin: 5px 0;">${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.postalCode}</p>
            <p style="margin: 5px 0;">Phone: ${orderData.deliveryAddress.phone}</p>
          </div>
          
          <p style="color: #555; font-size: 16px;">We'll send you another email when your order ships. You can track your order status in your account dashboard.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center; color: #888; font-size: 14px;">
            <p>Thank you for choosing KrishiBazar!</p>
            <p style="margin-top: 20px;">© 2024 KrishiBazar. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendOrderConfirmationEmail
};