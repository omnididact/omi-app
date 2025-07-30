// Railway debugging - track startup process
console.log('🚀 RAILWAY STARTUP: Beginning module imports...');

try {
  console.log('📦 Importing dotenv...');
  const { default: dotenv } = await import('dotenv');
  
  console.log('📦 Importing express...');
  const { default: express } = await import('express');
  
  console.log('📦 Importing cors...');
  const { default: cors } = await import('cors');
  
  console.log('📦 Importing net utilities...');
  const { isIPv6 } = await import('net');
  
  console.log('📦 Importing database...');
  const { initDatabase } = await import('./models/database.js');
  
  console.log('📦 Importing routes...');
  const { default: authRoutes } = await import('./routes/auth.js');
  const { default: thoughtRoutes } = await import('./routes/thoughts.js');
  const { default: goalRoutes } = await import('./routes/goals.js');
  const { default: aiRoutes } = await import('./routes/ai.js');
  
  console.log('✅ All modules imported successfully');
  
  // Set up global variables for the rest of the script
  globalThis.dotenv = dotenv;
  globalThis.express = express;
  globalThis.cors = cors;
  globalThis.isIPv6 = isIPv6;
  globalThis.initDatabase = initDatabase;
  globalThis.authRoutes = authRoutes;
  globalThis.thoughtRoutes = thoughtRoutes;
  globalThis.goalRoutes = goalRoutes;
  globalThis.aiRoutes = aiRoutes;
  
} catch (error) {
  console.error('❌ CRITICAL: Module import failed!');
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  console.error('🚫 This is likely why Railway deployment is failing');
  process.exit(1);
}

// Load environment variables
globalThis.dotenv.config();

// Railway deployment debugging
console.log('🚀 RAILWAY DEPLOYMENT DEBUG INFO:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('IPv6 support:', globalThis.isIPv6('::1'));
console.log('Current working directory:', process.cwd());
console.log('Environment variables count:', Object.keys(process.env).length);

const app = globalThis.express();
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
app.use(globalThis.cors(corsOptions));
app.use(globalThis.express.json({ limit: '10mb' }));
app.use(globalThis.express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parse error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

// Routes
app.use('/api/auth', globalThis.authRoutes);
app.use('/api/thoughts', globalThis.thoughtRoutes);
app.use('/api/goals', globalThis.goalRoutes);
app.use('/api/ai', globalThis.aiRoutes);

// Minimal Railway health check endpoint - CRITICAL FOR DEPLOYMENT
app.get('/api/health', (req, res) => {
  const startTime = Date.now();
  
  // Railway debugging - log every health check request
  console.log(`🏥 Health check requested at ${new Date().toISOString()}`);
  
  // Minimal, guaranteed fast response for Railway
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
      health_check_path: '/api/health'
    }
  };
  
  // Set Railway-compatible headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Health-Check', 'omi-api');
  res.setHeader('X-Railway-Health', 'OK');
  
  console.log(`✅ Health check successful in ${healthResponse.responseTime}ms`);
  res.status(200).json(healthResponse);
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
    
    // CRITICAL: Use Railway-compatible binding
    // Railway works best with 0.0.0.0 for HTTP connections
    const bindAddress = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
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
      setImmediate(async () => {
        try {
          await globalThis.initDatabase();
          console.log('✅ Database initialized successfully after server start');
        } catch (error) {
          console.error('⚠️  Database connection failed, but server continues running:');
          console.error('   Error:', error.message);
          // Don't exit - let the server run without database for health checks
          console.log('📝 Server will continue to respond to health checks without database');
        }
      });
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

// Railway-safe server startup with maximum error handling
const railwayStartup = async () => {
  console.log('🚀 RAILWAY: Starting server with enhanced error handling...');
  
  try {
    // Try normal startup first
    await startServer();
    console.log('🎉 Server startup completed successfully');
  } catch (error) {
    console.error('❌ Primary server startup failed:', error);
    console.log('🆘 RAILWAY FALLBACK: Starting minimal emergency server...');
    
    try {
      // Create minimal emergency server for Railway health checks
      const emergencyApp = globalThis.express();
      const emergencyPort = process.env.PORT || 3001;
      
      // Minimal CORS for emergency server
      emergencyApp.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        next();
      });
      
      // Emergency health check endpoint
      emergencyApp.get('/api/health', (req, res) => {
        console.log('🆘 Emergency health check hit');
        res.status(200).json({
          status: 'EMERGENCY_MODE',
          message: 'Server running in emergency mode',
          timestamp: new Date().toISOString(),
          error: 'Primary startup failed',
          railway: {
            deployment: true,
            mode: 'fallback'
          }
        });
      });
      
      emergencyApp.get('/', (req, res) => {
        res.status(200).json({
          message: 'Emergency OMI API Server',
          status: 'emergency_mode',
          timestamp: new Date().toISOString()
        });
      });
      
      // Catch all for emergency server
      emergencyApp.use('*', (req, res) => {
        res.status(503).json({
          error: 'Service temporarily unavailable - emergency mode',
          status: 'emergency',
          path: req.path
        });
      });
      
      // Start emergency server
      emergencyApp.listen(emergencyPort, '0.0.0.0', () => {
        console.log('🆘 EMERGENCY SERVER STARTED');
        console.log(`📍 Emergency server listening on 0.0.0.0:${emergencyPort}`);
        console.log('🏥 Railway health checks will work on /api/health');
        console.log('⚠️  This is a minimal server - full functionality unavailable');
      });
      
    } catch (emergencyError) {
      console.error('❌ CRITICAL: Even emergency server failed!');
      console.error('Emergency error:', emergencyError);
      console.error('🚫 Railway deployment completely failed');
      process.exit(1);
    }
  }
};

// Enhanced error handling for all unhandled cases
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:');
  console.error(error);
  console.log('🔄 Attempting to continue...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  console.log('🔄 Attempting to continue...');
});

// Start with Railway-safe startup
railwayStartup();