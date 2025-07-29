import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🚀 Railway Deployment Checklist\n');

// Check environment variables
console.log('📋 Environment Variables:');
const requiredEnvVars = ['NODE_ENV', 'JWT_SECRET', 'OPENAI_API_KEY'];
let envVarsOk = true;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    envVarsOk = false;
  }
});

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL: Set (PostgreSQL will be used)');
} else {
  console.log('⚠️  DATABASE_URL: Not set (SQLite will be used - OK for local dev)');
}

// Check package.json
console.log('\n📦 Package Configuration:');
const packageJson = JSON.parse(fs.readFileSync(join(__dirname, 'package.json'), 'utf8'));

if (packageJson.engines && packageJson.engines.node) {
  console.log(`✅ Node.js version specified: ${packageJson.engines.node}`);
} else {
  console.log('❌ Node.js version not specified in package.json');
}

if (packageJson.dependencies.pg) {
  console.log('✅ PostgreSQL driver (pg) installed');
} else {
  console.log('❌ PostgreSQL driver (pg) not installed');
}

// Check deployment files
console.log('\n📄 Deployment Files:');
const deploymentFiles = ['nixpacks.toml', 'railway.json'];

deploymentFiles.forEach(file => {
  if (fs.existsSync(join(__dirname, file))) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.log(`❌ ${file}: Missing`);
  }
});

// Summary
console.log('\n📊 Summary:');
if (envVarsOk && process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.log('⚠️  Warning: Running in production mode without DATABASE_URL');
  console.log('   Railway PostgreSQL service must be added for production deployment');
}

if (!envVarsOk) {
  console.log('❌ Some required environment variables are missing');
  console.log('   Please set them in Railway dashboard before deployment');
} else {
  console.log('✅ All required environment variables are set');
}

console.log('\n💡 Next Steps:');
console.log('1. Add PostgreSQL service in Railway dashboard');
console.log('2. Set environment variables in Railway');
console.log('3. Push code to trigger deployment');
console.log('4. Monitor logs: railway logs');