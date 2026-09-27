// COOPER Complex Hub - Root Startup Entry Point for Hostinger / Cloud Hosting
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const distServer = path.join(__dirname, 'backend', 'dist', 'server.js');

if (fs.existsSync(distServer)) {
  console.log('[STARTUP] Starting COOPER Complex Hub from backend/dist/server.js...');
  require(distServer);
} else {
  console.log('[STARTUP] backend/dist/server.js not found. Triggering automated compilation...');
  try {
    const buildScript = path.join(__dirname, 'backend', 'build.js');
    execSync(`"${process.execPath}" "${buildScript}"`, {
      stdio: 'inherit',
      cwd: __dirname,
      env: process.env
    });

    if (fs.existsSync(distServer)) {
      console.log('[STARTUP] Build successful. Launching server...');
      require(distServer);
    } else {
      throw new Error(`Build script exited but file not found at: ${distServer}`);
    }
  } catch (err) {
    console.error('[STARTUP ERROR] Unable to initialize COOPER Complex Hub:');
    console.error(err);
    process.exit(1);
  }
}
