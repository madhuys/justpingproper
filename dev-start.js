const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting JustPing development servers...\n');

// Start Next.js frontend on port 3000
const nextProcess = spawn('npm', ['run', 'next:dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Start Express backend on port 8080
const backendProcess = spawn('node', ['app.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'local' }
});

// Handle process termination
const cleanup = () => {
  console.log('\n🛑 Shutting down servers...');
  nextProcess.kill();
  backendProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle errors
nextProcess.on('error', (err) => {
  console.error('❌ Next.js process error:', err);
});

backendProcess.on('error', (err) => {
  console.error('❌ Backend process error:', err);
});

console.log('✅ Frontend: http://localhost:3000');
console.log('✅ Backend API: http://localhost:8080');
console.log('\nPress Ctrl+C to stop both servers\n');