const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting JustPing Development Environment...\n');

// Colors for output
const colors = {
  backend: '\x1b[34m', // Blue
  frontend: '\x1b[32m', // Green
  reset: '\x1b[0m'
};

// Start backend with PORT environment variable
console.log(`${colors.backend}[Backend]${colors.reset} Starting backend server on port 3001...`);
const backendEnv = { ...process.env, PORT: '3001' };
const backend = spawn('node', ['scripts/generate-docs.js'], {
  stdio: 'pipe',
  shell: true,
  env: backendEnv
});

// After docs generation, start the actual backend
backend.on('exit', () => {
  const backendServer = spawn('node', ['scripts/track-progress.js'], {
    stdio: 'pipe',
    shell: true,
    env: backendEnv
  });
  
  backendServer.on('exit', () => {
    const actualBackend = spawn('nodemon', ['./bin/www'], {
      stdio: 'pipe',
      shell: true,
      env: backendEnv
    });
    
    // Handle backend output
    actualBackend.stdout.on('data', (data) => {
      process.stdout.write(`${colors.backend}[Backend]${colors.reset} ${data}`);
    });

    actualBackend.stderr.on('data', (data) => {
      process.stderr.write(`${colors.backend}[Backend ERROR]${colors.reset} ${data}`);
    });
    
    // Store reference for cleanup
    global.backendProcess = actualBackend;
  });
});

// Start frontend - directly call next dev, not npm run dev
console.log(`${colors.frontend}[Frontend]${colors.reset} Starting frontend server on port 3000...`);
const frontend = spawn('npx', ['next', 'dev'], {
  stdio: 'pipe',
  shell: true,
  cwd: path.join(__dirname, 'frontend')
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  process.stdout.write(`${colors.frontend}[Frontend]${colors.reset} ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`${colors.frontend}[Frontend ERROR]${colors.reset} ${data}`);
});

// Handle process exits
frontend.on('exit', (code) => {
  console.log(`${colors.frontend}[Frontend]${colors.reset} Process exited with code ${code}`);
  if (global.backendProcess) {
    global.backendProcess.kill();
  }
  process.exit(code);
});

// Handle CTRL+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  if (global.backendProcess) {
    global.backendProcess.kill();
  }
  frontend.kill();
  process.exit(0);
});

console.log('\n📱 Frontend will be available at: http://localhost:3000');
console.log('🔧 Backend will be available at: http://localhost:3001');
console.log('\n💡 Press Ctrl+C to stop both servers\n');