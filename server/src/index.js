import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';

import connectDB from './config/db.js';
import configurePassport from './config/passport.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import categoryRoutes from './routes/categories.js';
import budgetRoutes from './routes/budgets.js';
import profileRoutes from './routes/profile.js';

// Validate required env vars (optional ones like Google OAuth, Cloudinary, Twilio are guarded lazily)
const required = ['MONGODB_URI', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];
required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Required env variable missing: ${key}`);
  }
});

const optional = ['GOOGLE_CLIENT_ID', 'CLOUDINARY_CLOUD_NAME', 'TWILIO_ACCOUNT_SID', 'SMTP_USER'];
optional.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  Optional env variable not set: ${key} (related feature will be unavailable)`);
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Passport config
configurePassport();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// Error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the process with: lsof -ti :${PORT} | xargs kill -9`);
    process.exit(1);
  } else {
    throw err;
  }
});
