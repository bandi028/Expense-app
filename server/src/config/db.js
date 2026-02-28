import mongoose from 'mongoose';

const connectDB = async () => {
    let retries = 5;
    while (retries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ MongoDB connected');
            break;
        } catch (err) {
            retries -= 1;
            console.error(`❌ MongoDB connection failed. Retries left: ${retries}`, err.message);
            if (retries === 0) process.exit(1);
            await new Promise((res) => setTimeout(res, 5000));
        }
    }
};

export default connectDB;
