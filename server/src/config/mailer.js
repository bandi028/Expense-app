import nodemailer from 'nodemailer';

// Lazy transporter — created on first use, not at import time
let _transporter = null;
export const getTransporter = () => {
    if (!_transporter) {
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return _transporter;
};

export default getTransporter;
