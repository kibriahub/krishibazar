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

// Submit contact form
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const transporter = createTransporter();
    
    // Email to admin/support team
    const adminMailOptions = {
      from: `"KrishiBazar Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; margin: 0;">KrishiBazar</h1>
            <p style="color: #666; margin: 5px 0;">Contact Form Submission</p>
          </div>
          
          <h2 style="color: #333;">New Contact Form Message</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="color: #555; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center; color: #888; font-size: 14px;">
            <p>This message was sent from the KrishiBazar contact form.</p>
            <p style="margin-top: 20px;">© 2024 KrishiBazar. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Confirmation email to user
    const userMailOptions = {
      from: `"KrishiBazar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting KrishiBazar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; margin: 0;">KrishiBazar</h1>
            <p style="color: #666; margin: 5px 0;">Your Trusted Agricultural Marketplace</p>
          </div>
          
          <h2 style="color: #333;">Thank You for Contacting Us!</h2>
          
          <p style="color: #555; font-size: 16px;">Hello ${name},</p>
          
          <p style="color: #555; font-size: 16px;">Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Message Summary:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Submitted on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p style="color: #555; font-size: 16px;">Our team typically responds within 24-48 hours during business days (Sunday-Thursday).</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center; color: #888; font-size: 14px;">
            <p>Best regards,<br>The KrishiBazar Team</p>
            <p style="margin-top: 20px;">© 2024 KrishiBazar. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!'
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};

module.exports = {
  submitContactForm
};