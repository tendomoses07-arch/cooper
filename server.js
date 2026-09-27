// COOPER Complex Hub - Root Startup Entry Point for Hostinger / Cloud Hosting
const path = require('path');
const fs = require('fs');

const distServer = path.join(__dirname, 'backend', 'dist', 'server.js');

if (fs.existsSync(distServer)) {
  require(distServer);
} else {
  console.log('[STARTUP] backend/dist/server.js not found. Building now...');
  try {
    const { execSync } = require('child_process');
    execSync('node backend/build.js', { stdio: 'inherit', cwd: __dirname });
    if (fs.existsSync(distServer)) {
      require(distServer);
    } else {
      throw new Error('Build finished but backend/dist/server.js was not generated.');
    }
  } catch (err) {
    console.error('[STARTUP ERROR] Unable to initialize COOPER Complex Hub:', err.message);
    process.exit(1);
  }
}
