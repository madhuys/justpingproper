const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting JustPing Development Environment...\n');

// Kill any process using port 8080 or 3000
console.log('Cleaning up any existing processes...');

// Start backend with PORT 8080
console.log('[Backend] Starting backend server on port 8080...');
const backendEnv = Object.assign({}, process.env, { PORT: '8080' });
const backend = spawn('nodemon', ['./bin/www'], {
  stdio: 'inherit',
  shell: true,
  env: backendEnv
});

// Wait a bit for backend to start
setTimeout(() => {
  // Start frontend
  console.log('\n[Frontend] Starting frontend server on port 3000...');
  const frontend = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, 'frontend')
  });
  
  // Handle CTRL+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
  
  // Handle process exits
  backend.on('exit', (code) => {
    console.log('\n[Backend] Process exited');
    frontend.kill();
    process.exit(code);
  });
  
  frontend.on('exit', (code) => {
    console.log('\n[Frontend] Process exited');
    backend.kill();
    process.exit(code);
  });
}, 3000);

console.log('\n📱 Frontend will be available at: http://localhost:3000');
console.log('🔧 Backend will be available at: http://localhost:8080');
console.log('\n💡 Press Ctrl+C to stop both servers\n');