import mongoose from 'mongoose';

const connectDB = async () => {
    let retries = 5;
    while (retries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
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

mongoose.connection.on('error', (err) => {
    console.error('⚠️ MongoDB connection error explicitly fired:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB gracefully disconnected from cluster.');
});

export default connectDB;
