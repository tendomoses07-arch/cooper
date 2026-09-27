const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[BUILD] Starting backend build process...');

// 1. Resolve TypeScript CLI path (supports hoisted root and local backend node_modules)
let tscPath = null;
const candidatePaths = [
  path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc'),
  path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc')
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    tscPath = p;
    break;
  }
}

if (!tscPath) {
  try {
    const tsEntry = require.resolve('typescript', { paths: [__dirname, path.join(__dirname, '..')] });
    const resolvedBin = path.join(path.dirname(tsEntry), '..', 'bin', 'tsc');
    if (fs.existsSync(resolvedBin)) {
      tscPath = resolvedBin;
    }
  } catch {
    tscPath = null;
  }
}

if (tscPath) {
  console.log(`[BUILD] Invoking TypeScript via Node from: ${tscPath}`);
  execSync(`node "${tscPath}"`, { stdio: 'inherit', cwd: __dirname });
} else {
  console.log('[BUILD] Invoking TypeScript via npx...');
  execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
}

// 2. Ensure dist/database exists and copy schema.sql for production startup
const distDbDir = path.join(__dirname, 'dist', 'database');
fs.mkdirSync(distDbDir, { recursive: true });
const schemaSrc = path.join(__dirname, 'src', 'database', 'schema.sql');
const schemaDest = path.join(distDbDir, 'schema.sql');

if (fs.existsSync(schemaSrc)) {
  fs.copyFileSync(schemaSrc, schemaDest);
  console.log('[BUILD] Copied database schema.sql to dist/database/schema.sql');
}

console.log('[BUILD] Backend compilation completed successfully.');
