import mongoose from 'mongoose';
import { env } from './env.js';

// Reject query operators injected into filter values ($gt, $where, ...)
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export async function connectDB() {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  console.log('✅ MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
