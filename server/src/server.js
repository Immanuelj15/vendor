import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startJobs } from './jobs/jobRunner.js';

const startServer = async () => {
  try {
    // Connect to MongoDB FIRST
    await connectDB();

    console.log('[Database] Connection established successfully.');

    const PORT = env.PORT || 5000;

    // Start API only after MongoDB is connected
    app.listen(PORT, '0.0.0.0', () => {
      console.log('==========================================');
      console.log(`🚀 FairKart API Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${env.NODE_ENV}`);
      console.log('==========================================');
    });

    startJobs();

  } catch (error) {
    console.error('[Fatal] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();