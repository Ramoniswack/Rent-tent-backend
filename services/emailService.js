const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// DRY Base Layout for bulletproof email rendering
const baseEmailLayout = (content, headerColor = '#059467', headerTitle = 'NomadNotes', headerIcon = '') => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f8f7; color: #0f231d;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f8f7; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            
            <tr>
              <td align="center" style="padding: 40px 20px 20px 20px;">
                ${headerIcon ? `
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                    <tr>
                      <td align="center" valign="middle" width="80" height="80" style="background-color: ${headerColor}; border-radius: 20px;">
                        ${headerIcon}
                      </td>
                    </tr>
                  </table>
                ` : ''}
                <h1 style="color: ${headerColor}; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">${headerTitle}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding: 20px 40px 40px 40px;">
                ${content}
              </td>
            </tr>

            <tr>
              <td style="text-align: center; padding: 24px; border-top: 2px solid #f5f8f7; background-color: #ffffff;">
                <p style="color: #666; font-size: 14px; margin: 0 0 16px 0;">
                  Need help? Visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #059467; text-decoration: none; font-weight: 600;">support page</a>
                </p>
                <p style="color: #999; font-size: 12px; margin: 0;">
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
`;

// Helper for UI Buttons
const renderButton = (url, text, bgColor = '#059467', textColor = '#ffffff') => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
    <tr>
      <td align="center">
        <a href="${url}" style="display: inline-block; padding: 16px 40px; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">${text}</a>
      </td>
    </tr>
  </table>
`;

// Email templates
const emailTemplates = {
  
  welcome: (user) => ({
    subject: 'Welcome to NomadNotes! 🎉',
    html: baseEmailLayout(`
      <p style="font-size: 18px; line-height: 1.6; margin: 0 0 16px 0;">Hi <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Welcome aboard! We're thrilled to have you join our community of adventurers and travel enthusiasts.</p>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">Your account <strong>@${user.username}</strong> is now active and ready to explore!</p>

      <div style="background-color: #f5f8f7; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
        <h2 style="font-size: 18px; font-weight: 900; margin: 0 0 16px 0;">What you can do now:</h2>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;" width="30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px;"><strong>Plan Your Trips</strong> - Create detailed itineraries</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;" width="30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px;"><strong>Rent Gear</strong> - Browse and book travel equipment</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;" width="30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px;"><strong>Connect</strong> - Match with fellow travelers</td>
          </tr>
          <tr>
            <td style="padding: 12px 0;" width="30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </td>
            <td style="padding: 12px 0; font-size: 15px;"><strong>Chat</strong> - Message your matches in real-time</td>
          </tr>
        </table>
      </div>

      ${renderButton(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`, 'Get Started Now →')}
    `, '#059467', 'Welcome to NomadNotes!', '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>')
  }),

  newOrder: ({ booking, gear, renter }) => ({
    subject: `New Rental Order for ${gear.title} 🎉`,
    html: baseEmailLayout(`
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Great news! You have a new rental order for your gear.</p>

      <div style="background-color: #f5f8f7; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; font-weight: 900; margin: 0 0 16px 0;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr><td style="padding: 8px 0; color: #666;">Gear:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${gear.title}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Renter:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${renter.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Start Date:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date(booking.startDate).toLocaleDateString()}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">End Date:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date(booking.endDate).toLocaleDateString()}</td></tr>
          <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 16px 0 0; color: #666;">Total Amount:</td><td style="padding: 16px 0 0; color: #059467; font-weight: 900; font-size: 20px; text-align: right;">NPR ${booking.totalPrice}</td></tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="24" valign="top"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 2px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></td>
            <td style="color: #92400e; font-size: 14px; font-weight: bold; line-height: 1.4;">Action Required: Please review and confirm this booking within 24 hours.</td>
          </tr>
        </table>
      </div>

      ${renderButton(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${booking._id}`, 'View Order Details →', '#f59e0b')}
    `, '#f59e0b', 'New Rental Order!', '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>')
  }),

  orderConfirmed: ({ booking, gear, owner }) => ({
    subject: `Your Rental is Confirmed! ${gear.title} ✅`,
    html: baseEmailLayout(`
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Great news! Your rental booking has been confirmed by the owner.</p>

      <div style="background-color: #f5f8f7; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; font-weight: 900; margin: 0 0 16px 0;">Booking Details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr><td style="padding: 8px 0; color: #666;">Gear:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${gear.title}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Owner:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${owner.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Pickup Date:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date(booking.startDate).toLocaleDateString()}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Return Date:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date(booking.endDate).toLocaleDateString()}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Location:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${gear.location}</td></tr>
          <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 16px 0 0; color: #666;">Total Paid:</td><td style="padding: 16px 0 0; color: #059467; font-weight: 900; font-size: 20px; text-align: right;">NPR ${booking.totalPrice}</td></tr>
        </table>
      </div>

      <div style="background-color: #d1fae5; border-left: 4px solid #059467; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
        <h3 style="color: #065f46; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Next Steps:</h3>
        <ul style="color: #065f46; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>Contact the owner to arrange pickup details</li>
          <li>Inspect the gear upon pickup</li>
          <li>Return the gear in good condition by the return date</li>
        </ul>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-right: 8px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${booking._id}" style="display: inline-block; padding: 14px 24px; background-color: #059467; color: white; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 15px;">View Booking</a>
          </td>
          <td align="center" style="padding-left: 8px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/messages?user=${owner._id}" style="display: inline-block; padding: 14px 24px; background-color: white; color: #059467; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 15px; border: 2px solid #059467;">Message Owner</a>
          </td>
        </tr>
      </table>
    `, '#059467', 'Booking Confirmed!', '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>')
  }),

  newMatch: ({ currentUser, matchedUser }) => ({
    subject: `You matched with ${matchedUser.name}! 💚`,
    html: baseEmailLayout(`
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td align="center">
            <img src="${matchedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedUser.name)}&background=ec4899&color=fff&size=200`}" style="width: 120px; height: 120px; border-radius: 60px; border: 4px solid #ec4899; display: block;" alt="${matchedUser.name}">
            <h2 style="font-size: 24px; font-weight: 900; margin: 16px 0 4px 0;">${matchedUser.name}</h2>
            <p style="color: #ec4899; font-size: 16px; font-weight: bold; margin: 0;">@${matchedUser.username}</p>
          </td>
        </tr>
      </table>

      <p style="font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
        You and <strong>${matchedUser.name}</strong> liked each other! Start a conversation and plan your next adventure together.
      </p>

      ${matchedUser.bio ? `
      <div style="background-color: #f5f8f7; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="color: #666; font-size: 15px; line-height: 1.6; font-style: italic; margin: 0;">"${matchedUser.bio}"</p>
      </div>
      ` : ''}

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
          <tr>
            <td width="24" valign="top"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></td>
            <td style="color: #92400e; font-size: 14px; font-weight: bold;">Conversation Starters:</td>
          </tr>
        </table>
        <ul style="color: #92400e; font-size: 13px; margin: 0; padding-left: 24px; line-height: 1.6;">
          <li>Ask about their favorite travel destination</li>
          <li>Share your upcoming trip plans</li>
          <li>Discuss gear recommendations</li>
        </ul>
      </div>

      ${renderButton(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/messages?user=${matchedUser._id}`, 'Send a Message 💬', '#ec4899')}
    `, '#ec4899', 'It\'s a Match!', '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>')
  }),

  // Newsletter welcome email
  newsletterWelcome: (data) => ({
    subject: 'Welcome to NomadNotes Newsletter! 📬',
    html: baseEmailLayout(`
      <p style="color: #0f231d; font-size: 18px; line-height: 1.6; margin-bottom: 16px;">
        Thanks for subscribing to the NomadNotes newsletter!
      </p>
      <p style="color: #0f231d; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        You'll now receive the latest travel tips, gear recommendations, and exclusive updates straight to your inbox.
      </p>

      <div style="background-color: #f5f8f7; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
        <h2 style="color: #0f231d; font-size: 20px; font-weight: 900; margin-bottom: 16px;">What to expect:</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #0f231d;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 12px;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <strong>Weekly Travel Tips</strong> - Expert advice for your adventures
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #0f231d;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 12px;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <strong>Gear Reviews</strong> - Latest equipment recommendations
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #0f231d;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 12px;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <strong>Exclusive Deals</strong> - Special offers for subscribers
          </li>
          <li style="padding: 12px 0; color: #0f231d;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 12px;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <strong>Community Stories</strong> - Inspiring travel experiences
          </li>
        </ul>
      </div>

      ${renderButton(`${process.env.FRONTEND_URL || 'http://localhost:3000'}`, 'Explore NomadNotes →', '#059467')}

      <div style="text-align: center; padding-top: 24px; margin-top: 24px; border-top: 2px solid #f5f8f7;">
        <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">
          You're receiving this because you subscribed to our newsletter.
        </p>
      </div>
    `, '#059467', 'You\'re Subscribed!', '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>')
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'NomadNotes'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${template} to ${to} - Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email error (${template}):`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};