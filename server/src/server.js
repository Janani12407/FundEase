import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n=============================================================`);
    console.log(`  FundEase Scholarship Disbursement Platform - Backend API`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Server Port: ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=============================================================\n`);
  });
};

startServer();
