/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const projectRoot = process.cwd();
const lockPath = path.join(projectRoot, '.next', 'dev', 'lock');
const nextPatchedFiles = [
  path.join(projectRoot, 'node_modules', 'next', 'dist', 'server', 'lib', 'start-server.js'),
  path.join(projectRoot, 'node_modules', 'next', 'dist', 'compiled', 'webpack', 'bundle5.js'),
  path.join(projectRoot, 'node_modules', 'next', 'dist', 'cli', 'next-dev.js'),
];

function stripConsoleNinjaPatches(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original.replace(/\/\* build-hook-start \*\/\*\d+\*\/.*?\/\* build-hook-end \*\/\r?\n?/gs, '');
  updated = updated.replace(/\/\* custom-patch-cn1-start \*\/\*\d+\*\/.*?\/\* custom-patch-cn1-end \*\/\s*/gs, '');

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

function sanitizeNextInstall() {
  for (const filePath of nextPatchedFiles) {
    stripConsoleNinjaPatches(filePath);
  }
}

function readLockFile() {
  if (!fs.existsSync(lockPath)) {
    return null;
  }

  try {
    const lockContents = fs.readFileSync(lockPath, 'utf8');
    return JSON.parse(lockContents);
  } catch {
    return null;
  }
}

function isProcessRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function removeLockFile() {
  try {
    fs.rmSync(lockPath, { force: true });
  } catch {
    // Ignore cleanup failures and let Next handle any remaining state.
  }
}

function stopLockedProcess(pid) {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // Ignore if the process is already gone.
  }
}

function startNextDev() {
  const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'dev', '--webpack'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

const lock = readLockFile();

if (lock?.pid && isProcessRunning(lock.pid)) {
  const appUrl = lock.appUrl || `http://${lock.hostname || 'localhost'}:${lock.port || 3000}`;
  console.log(`Next dev is already running for this project at ${appUrl} (PID ${lock.pid}).`);
  process.exit(0);
}

if (lock?.pid) {
  stopLockedProcess(lock.pid);
}

removeLockFile();
sanitizeNextInstall();
startNextDev();