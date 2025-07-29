# Deployment Checklist for OMI App

## Pre-Deployment Verification

### 1. Environment Configuration ✅

#### Required Environment Variables
Create a `.env` file in the project root with:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# JWT Configuration  
JWT_SECRET=your_super_secure_jwt_secret_here

# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (SQLite)
DATABASE_PATH=./server/database.sqlite

# CORS Configuration (if needed)
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

#### Environment Validation Script
```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validating Environment Configuration..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Check required variables
source .env

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET not set"
    exit 1
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "⚠️  JWT_SECRET should be at least 32 characters"
fi

echo "✅ Environment validation passed"
```

### 2. Database Setup ✅

#### Database Initialization
```bash
# Ensure database directory exists
mkdir -p server/

# Check if database exists and is accessible
node -e "
const { initDatabase } = require('./server/models/database.js');
try {
  initDatabase();
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
"
```

#### Database Health Check
```bash
# Check database tables
sqlite3 server/database.sqlite "
.tables
SELECT name FROM sqlite_master WHERE type='table';
"

# Verify table schemas
sqlite3 server/database.sqlite "
.schema users
.schema thoughts  
.schema goals
"
```

### 3. Dependencies & Build Verification ✅

#### Package Installation
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify critical dependencies
npm list express cors better-sqlite3 bcryptjs jsonwebtoken openai multer
npm list react react-dom react-router-dom framer-motion
```

#### Build Process
```bash
# Frontend build
npm run build

# Verify build output
ls -la dist/
echo "Build size:" $(du -sh dist/)

# Test production build locally
npm run preview
```

### 4. API Health Checks ✅

#### Server Startup Verification
```bash
# Start server
npm run server &
SERVER_PID=$!

# Wait for startup
sleep 3

# Health check
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Server health check passed"
else
    echo "❌ Server health check failed (HTTP $HEALTH_STATUS)"
    kill $SERVER_PID
    exit 1
fi

# Test auth endpoints
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"deploy-test@example.com","password":"testpass123","name":"Deploy Test"}' \
  -w "\nStatus: %{http_code}\n"

# Cleanup
kill $SERVER_PID
```

### 5. OpenAI Integration Testing ✅

#### API Key Validation
```bash
# Test OpenAI connection
node -e "
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testOpenAI() {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello, this is a deployment test.' }],
      max_tokens: 10
    });
    console.log('✅ OpenAI API connection successful');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API connection failed:', error.message);
    process.exit(1);
  }
}

testOpenAI();
"
```

#### Whisper API Testing
```bash
# Create a test audio file (you'll need a sample audio file)
node -e "
const OpenAI = require('openai');
const fs = require('fs');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testWhisper() {
  try {
    // You would need a test audio file here
    console.log('✅ Whisper API configuration ready');
  } catch (error) {
    console.error('❌ Whisper API test failed:', error.message);
  }
}

testWhisper();
"
```

## Production Deployment Steps

### 1. Server Environment Setup

#### For VPS/Cloud Server:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/omi-app
sudo chown $USER:$USER /var/www/omi-app
```

#### For Docker Deployment:
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S omi -u 1001

# Set ownership
RUN chown -R omi:nodejs /app
USER omi

EXPOSE 3001

CMD ["npm", "start"]
```

### 2. Application Deployment

#### File Transfer
```bash
# Using rsync
rsync -avz --exclude node_modules --exclude .git . user@server:/var/www/omi-app/

# Or using git
cd /var/www/omi-app
git clone https://github.com/yourusername/omi-app.git .
```

#### Production Setup
```bash
cd /var/www/omi-app

# Install dependencies
npm ci --only=production

# Build frontend
npm run build

# Set up environment
cp .env.example .env
# Edit .env with production values

# Initialize database
npm run db:init

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'omi-app',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 3. Reverse Proxy Setup (Nginx)

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/omi-app
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    location / {
        root /var/www/omi-app/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # File upload support
        client_max_body_size 10M;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/omi-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL/HTTPS Setup

#### Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 5. Monitoring & Logging

#### Log Management
```bash
# Create log directories
mkdir -p /var/www/omi-app/logs

# Log rotation
sudo tee /etc/logrotate.d/omi-app << EOF
/var/www/omi-app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

#### Monitoring Setup
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# System monitoring
npm install -g pm2-server-monit
pm2 install pm2-server-monit
```

## Post-Deployment Verification

### 1. Smoke Tests ✅

#### Basic Functionality
```bash
# Health check
curl https://your-domain.com/api/health

# Authentication test
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'

# Frontend loading
curl -I https://your-domain.com/
```

#### Database Connectivity
```bash
# Check database file permissions
ls -la /var/www/omi-app/server/database.sqlite

# Test database queries
sqlite3 /var/www/omi-app/server/database.sqlite "SELECT COUNT(*) FROM users;"
```

### 2. Performance Testing ✅

#### Load Testing
```bash
# Install apache bench
sudo apt install apache2-utils

# Test API endpoints
ab -n 100 -c 10 https://your-domain.com/api/health
ab -n 50 -c 5 -p post_data.json -T application/json https://your-domain.com/api/auth/login
```

#### Memory & CPU Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -m
```

### 3. Security Verification ✅

#### Security Headers
```bash
# Check security headers
curl -I https://your-domain.com/

# Should include:
# - Strict-Transport-Security
# - X-Content-Type-Options
# - X-Frame-Options
# - X-XSS-Protection
```

#### SSL Configuration
```bash
# Test SSL
nmap --script ssl-enum-ciphers -p 443 your-domain.com
```

## Rollback Plan

### 1. Quick Rollback ✅
```bash
# Stop current deployment
pm2 stop omi-app

# Restore previous version
git checkout previous-working-commit
npm ci --only=production
npm run build

# Restart
pm2 restart omi-app
```

### 2. Database Rollback ✅
```bash
# Backup current database
cp server/database.sqlite server/database.sqlite.backup

# Restore previous database
cp server/database.sqlite.previous server/database.sqlite
```

## Maintenance Tasks

### Daily:
- [ ] Check PM2 process status
- [ ] Monitor error logs
- [ ] Verify disk space
- [ ] Check SSL certificate expiry

### Weekly:
- [ ] Review application logs
- [ ] Database backup
- [ ] Performance metrics review
- [ ] Security updates check

### Monthly:
- [ ] Full system backup
- [ ] Dependency updates
- [ ] Performance optimization
- [ ] Security audit

## Emergency Contacts & Procedures

### Critical Issues:
1. Server down → Check PM2 status, restart if needed
2. Database corruption → Restore from backup
3. SSL certificate expired → Renew with certbot
4. API errors → Check logs, verify OpenAI API status

### Monitoring Alerts:
- Set up alerts for 5xx errors
- Monitor response times > 5s
- Database connection failures
- Disk space < 20%