import twilio from 'twilio';

// Lazy client — only instantiated when first used, not at import time
let _client = null;
const getClient = () => {
    if (!_client) {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !token || !sid.startsWith('AC')) {
            throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
        }
        _client = twilio(sid, token);
    }
    return _client;
};

export const sendPhoneOTP = async (phone, otp) => {
    const client = getClient();
    await client.messages.create({
        body: `Your Expense Tracker OTP is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
    });
};
