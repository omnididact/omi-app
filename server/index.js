import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './models/database.js';
import authRoutes from './routes/auth.js';
import thoughtRoutes from './routes/thoughts.js';
import goalRoutes from './routes/goals.js';
import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'https://omi.symmetrycinema.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parse error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/thoughts', thoughtRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connectivity if available
    let dbStatus = 'not configured';
    if (process.env.DATABASE_URL) {
      try {
        // This import will be available after database.js is loaded
        const { runQuery } = await import('./models/database.js');
        await runQuery('SELECT 1');
        dbStatus = 'connected';
      } catch (dbErr) {
        dbStatus = 'connection failed';
      }
    }
    
    res.json({ 
      status: 'OK', 
      message: 'OMI API is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      database: dbStatus,
      port: process.env.PORT || 3001,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  // Start server first, then initialize database
  // Bind to 0.0.0.0 for Railway deployment compatibility
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OMI API server running on port ${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Initialize database after server is running
  try {
    await initDatabase();
    console.log('✅ Database initialized after server start');
  } catch (error) {
    console.error('⚠️  Database connection failed, but server is still running:', error);
    // Don't exit - let the server run without database for health checks
  }
};

// Start the server and handle any startup errors
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});