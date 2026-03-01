import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OTP from '../server/src/models/OTP.js';

dotenv.config({ path: '../server/.env' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected DB');

    const record = await OTP.findOne({ identifier: 'hemantham28@gmail.com', purpose: 'login' });
    if (!record) {
        console.log('❌ No OTP found in DB.');
        process.exit(0);
    }

    console.log('Got DB OTP Record:', record);

    const plain = process.argv[2] || '613862';
    const isValid = await bcrypt.compare(plain, record.otpHash);
    console.log(`Hash matches ${plain}?`, isValid);

    process.exit(0);
}

check();
