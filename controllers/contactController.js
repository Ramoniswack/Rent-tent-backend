const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send contact form email
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, topic, message } = req.body;

    // Validate required fields
    if (!name || !email || !topic || !message) {
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
        message: 'Invalid email format' 
      });
    }

    const transporter = createTransporter();

    // Email to admin
    const adminMailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'NomadNotes Contact'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `New Contact Form: ${topic}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f8f7;">
          <div style="background-color: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #059467; margin-bottom: 24px; font-size: 24px;">New Contact Form Submission</h2>
            
            <div style="background-color: #f5f8f7; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 8px 0; color: #0f231d;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 8px 0; color: #0f231d;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0; color: #0f231d;"><strong>Topic:</strong> ${topic}</p>
            </div>
            
            <div style="margin-top: 24px;">
              <h3 style="color: #0f231d; margin-bottom: 12px;">Message:</h3>
              <p style="color: #0f231d; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #f5f8f7;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This email was sent from the NomadNotes contact form.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Confirmation email to user
const userMailOptions = {
  from: `"${process.env.SMTP_FROM_NAME || 'NomadNotes'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
  to: email,
  subject: 'We received your message - NomadNotes',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank you for contacting us</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; color: #334155;">
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <tr>
                <td align="center" style="background-color: #059467; padding: 30px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">NomadNotes</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px; color: #0f231d; font-size: 20px;">We've got your message!</h2>
                  
                  <p style="margin: 0 0 16px; line-height: 1.6; color: #475569; font-size: 16px;">
                    Hi ${name},
                  </p>
                  
                  <p style="margin: 0 0 24px; line-height: 1.6; color: #475569; font-size: 16px;">
                    Thanks for reaching out about <strong>${topic}</strong>. Our team is reviewing your message and will get back to you within 24-48 hours. 
                  </p>
                  
                  <div style="background-color: #f8faf9; border-left: 4px solid #059467; padding: 16px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Your Message</p>
                    <p style="margin: 0; line-height: 1.6; color: #334155; font-size: 15px; font-style: italic; white-space: pre-wrap;">"${message}"</p>
                  </div>
                  
                  <p style="margin: 0 0 30px; line-height: 1.6; color: #475569; font-size: 16px;">
                    In the meantime, feel free to explore our platform to discover amazing travel gear and plan your next big adventure.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nomadnotes.com'}" style="display: inline-block; padding: 14px 28px; background-color: #059467; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Explore NomadNotes</a>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>

              <tr>
                <td style="background-color: #f8faf9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                    Best regards,<br><strong style="color: #059467;">The NomadNotes Team</strong>
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} NomadNotes. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
            
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `
};

    // Send both emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
