import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async ({ to, message }) => {
  try {
    // Twilio trial accounts can only send SMS to numbers verified in the Twilio console.
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log('SMS sent to:', to);
  } catch (err) {
    console.error('SMS error:', err.message);
    throw new Error('Failed to send SMS: ' + err.message);
  }
};
