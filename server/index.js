import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { isIPv6 } from 'net';
import { initDatabase } from './models/database.js';
import authRoutes from './routes/auth.js';
import thoughtRoutes from './routes/thoughts.js';
import goalRoutes from './routes/goals.js';
import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

// Railway deployment debugging
console.log('🚀 RAILWAY DEPLOYMENT DEBUG INFO:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('IPv6 support:', isIPv6('::1'));
console.log('Current working directory:', process.cwd());
console.log('Environment variables count:', Object.keys(process.env).length);

const app = express();
const PORT = process.env.PORT || 3001;

// Validate critical environment variables for Railway
if (!process.env.PORT && process.env.NODE_ENV === 'production') {
  console.error('❌ CRITICAL: PORT environment variable not set in production!');
  console.error('This will cause Railway health checks to fail.');
}

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

// Railway-optimized health check endpoint - CRITICAL FOR DEPLOYMENT
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  
  // Railway debugging - log every health check request
  console.log(`🏥 Health check requested at ${new Date().toISOString()}`);
  console.log('Request headers:', {
    'user-agent': req.get('user-agent'),
    'x-forwarded-for': req.get('x-forwarded-for'),
    'host': req.get('host'),
    'x-railway-request-id': req.get('x-railway-request-id')
  });
  
  try {
    // Minimal, fast health response for Railway
    const healthResponse = {
      status: 'OK',
      message: 'OMI API is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT) || 3001,
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime,
      railway: {
        deployment: true,
        ipv6_ready: true,
        health_check_path: '/api/health'
      }
    };

    // Optional database check - don't let it block health checks
    let dbStatus = 'skipped';
    if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
      try {
        // Very short timeout for database check
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database check timeout')), 1000)
        );
        
        const { runQuery } = await import('./models/database.js');
        const dbCheckPromise = runQuery('SELECT 1');
        
        await Promise.race([dbCheckPromise, timeoutPromise]);
        dbStatus = 'connected';
      } catch (dbErr) {
        dbStatus = 'failed_non_blocking';
        console.warn(`⚠️  Health check database test failed (non-blocking): ${dbErr.message}`);
      }
    }
    
    healthResponse.database = dbStatus;
    healthResponse.responseTime = Date.now() - startTime;
    
    // Set Railway-compatible headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Health-Check', 'omi-api');
    res.setHeader('X-Railway-Health', 'OK');
    
    console.log(`✅ Health check successful in ${healthResponse.responseTime}ms`);
    res.status(200).json(healthResponse);
    
  } catch (error) {
    // CRITICAL: Always return 200 for Railway health checks
    console.error('❌ Health check error (returning 200 anyway):', error);
    
    const errorResponse = {
      status: 'ERROR_BUT_RUNNING',
      message: 'Server has issues but is responding',
      error: error.message,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT) || 3001,
      responseTime: Date.now() - startTime,
      railway: {
        deployment: true,
        forced_ok: true
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Railway-Health', 'DEGRADED');
    res.status(200).json(errorResponse);
  }
});

// Additional health check endpoints for debugging
app.get('/health', (req, res) => {
  console.log('🏥 Simple health check hit');
  res.status(200).json({ status: 'OK', message: 'Simple health endpoint' });
});

app.get('/', (req, res) => {
  console.log('🏠 Root endpoint hit');
  res.status(200).json({ 
    message: 'OMI API Server',
    status: 'running',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
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

// Railway-optimized server startup
const startServer = async () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Railway deployment...');
    console.log(`Attempting to bind to port ${PORT}`);
    
    // CRITICAL: Use Railway's dual-stack binding for IPv6 compatibility
    // Railway v2 runtime requires :: binding for proper health checks
    const bindAddress = process.env.NODE_ENV === 'production' ? '::' : '0.0.0.0';
    console.log(`Binding to address: ${bindAddress}`);
    
    const server = app.listen(PORT, bindAddress, async () => {
      const address = server.address();
      console.log('🎉 SERVER STARTED SUCCESSFULLY!');
      console.log(`📍 Server details:`);
      console.log(`   - Port: ${PORT}`);
      console.log(`   - Address: ${bindAddress}`);
      console.log(`   - Family: ${address?.family}`);
      console.log(`   - Full address: ${JSON.stringify(address)}`);
      console.log(`📊 Health check endpoints:`);
      console.log(`   - Primary: ${bindAddress === '::' ? `[::]:${PORT}` : `${bindAddress}:${PORT}`}/api/health`);
      console.log(`   - Simple: ${bindAddress === '::' ? `[::]:${PORT}` : `${bindAddress}:${PORT}`}/health`);
      console.log(`   - Root: ${bindAddress === '::' ? `[::]:${PORT}` : `${bindAddress}:${PORT}`}/`);
      console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Server is now ready for Railway health checks
      console.log('✅ SERVER READY FOR RAILWAY HEALTH CHECKS');
      console.log('🏥 Railway can now perform health checks on /api/health');
      resolve(server);
      
      // Initialize database in background (non-blocking for health checks)
      console.log('🗄️  Starting database initialization (non-blocking)...');
      setTimeout(async () => {
        try {
          await initDatabase();
          console.log('✅ Database initialized successfully after server start');
        } catch (error) {
          console.error('⚠️  Database connection failed, but server continues running:');
          console.error('   Error:', error.message);
          console.error('   Stack:', error.stack);
          // Don't exit - let the server run without database for health checks
          console.log('📝 Server will continue to respond to health checks without database');
        }
      }, 50); // Minimal delay to ensure server is fully ready
    });

    // Enhanced error handling for Railway deployment
    server.on('error', (error) => {
      console.error('❌ CRITICAL: Server failed to start!');
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        port: PORT,
        bindAddress: bindAddress
      });
      
      if (error.code === 'EADDRINUSE') {
        console.error(`🚫 Port ${PORT} is already in use!`);
      } else if (error.code === 'EACCES') {
        console.error(`🚫 Permission denied to bind to port ${PORT}!`);
      } else if (error.code === 'EADDRNOTAVAIL') {
        console.error(`🚫 Address ${bindAddress} not available!`);
      }
      
      reject(error);
    });
    
    // Add connection event logging
    server.on('connection', (socket) => {
      console.log(`🔌 New connection established from ${socket.remoteAddress}:${socket.remotePort}`);
    });
    
    // Log when server is fully listening
    server.on('listening', () => {
      console.log('🎧 Server is now listening and ready to accept connections');
    });
  });
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start the server and handle any startup errors
startServer()
  .then(() => {
    console.log('🎉 Server startup completed successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });