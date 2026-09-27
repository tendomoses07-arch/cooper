const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[BUILD] Starting frontend build process...');

// 1. Resolve TypeScript CLI path (supports hoisted root and local frontend node_modules)
let tscPath = null;
const tscCandidates = [
  path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc'),
  path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc')
];
for (const p of tscCandidates) {
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

// 2. Resolve Vite CLI path (supports hoisted root and local frontend node_modules)
let vitePath = null;
const viteCandidates = [
  path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js'),
  path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js')
];
for (const p of viteCandidates) {
  if (fs.existsSync(p)) {
    vitePath = p;
    break;
  }
}
if (!vitePath) {
  try {
    const viteEntry = require.resolve('vite', { paths: [__dirname, path.join(__dirname, '..')] });
    const resolvedViteBin = path.join(path.dirname(viteEntry), '..', '..', 'bin', 'vite.js');
    if (fs.existsSync(resolvedViteBin)) {
      vitePath = resolvedViteBin;
    }
  } catch {
    vitePath = null;
  }
}

// Run typecheck
if (tscPath) {
  console.log(`[BUILD] Running TypeScript check via Node: ${tscPath}`);
  execSync(`"${process.execPath}" "${tscPath}" -b`, { stdio: 'inherit', cwd: __dirname });
} else {
  console.log('[BUILD] Running TypeScript check via npx...');
  execSync('npx tsc -b', { stdio: 'inherit', cwd: __dirname });
}

// Run Vite build
if (vitePath) {
  console.log(`[BUILD] Running Vite build via Node: ${vitePath}`);
  execSync(`"${process.execPath}" "${vitePath}" build`, { stdio: 'inherit', cwd: __dirname });
} else {
  console.log('[BUILD] Running Vite build via npx...');
  execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
}

console.log('[BUILD] Frontend build completed successfully.');
