require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('Testing SMTP Configuration...\n');
  
  console.log('SMTP Settings:');
  console.log('- Host:', process.env.SMTP_HOST);
  console.log('- Port:', process.env.SMTP_PORT);
  console.log('- Secure:', process.env.SMTP_SECURE);
  console.log('- User:', process.env.SMTP_USER);
  console.log('- Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
  console.log('- From:', process.env.SMTP_FROM);
  console.log('- Contact Email:', process.env.CONTACT_EMAIL);
  console.log('');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('Testing connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'NomadNotes'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: 'Test Email from NomadNotes Contact Form',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059467;">Test Email</h2>
          <p>This is a test email from the NomadNotes contact form SMTP configuration.</p>
          <p>If you received this, your SMTP setup is working correctly!</p>
          <p style="color: #666; font-size: 12px; margin-top: 32px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nCheck your inbox at:', process.env.CONTACT_EMAIL || process.env.SMTP_USER);
    
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    console.error('\nFull error:', error);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed. Please check:');
      console.error('1. SMTP_USER is correct');
      console.error('2. SMTP_PASS is a valid App Password (not your regular Gmail password)');
      console.error('3. 2-Factor Authentication is enabled on your Gmail account');
      console.error('4. Generate a new App Password at: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  Connection failed. Please check:');
      console.error('1. SMTP_HOST and SMTP_PORT are correct');
      console.error('2. Your firewall is not blocking port 587');
      console.error('3. Your internet connection is working');
    }
  }
}

testSMTP();
