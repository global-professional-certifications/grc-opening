const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', 'packages', 'server', '.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  console.log('Testing Resend with API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  console.log('From Address:', process.env.RESEND_FROM_ADDRESS);
  
  try {
    const data = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_ADDRESS}>`,
      to: 'delivered@resend.dev', // Resend test email
      subject: 'Test Email',
      html: '<strong>It works!</strong>',
    });
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testResend();
