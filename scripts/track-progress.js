#!/usr/bin/env node

/**
 * Track Progress Script
 * Simple script to track development progress and validate project setup
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting development server...');
console.log('📊 Tracking project progress...');

try {
  // Check if main files exist
  const mainFiles = [
    'app.js',
    'package.json',
    'knexfile.js',
    'bin/www'
  ];

  let allFilesExist = true;
  
  mainFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} - Found`);
    } else {
      console.log(`❌ ${file} - Missing`);
      allFilesExist = false;
    }
  });

  // Check if key directories exist
  const keyDirectories = [
    'AgentsFlow',
    'api',
    'system',
    'migrations'
  ];

  keyDirectories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 ${dir}/ - Found`);
    } else {
      console.log(`📁 ${dir}/ - Missing`);
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    console.log('✨ All essential files and directories are present');
    console.log('🎯 Project setup validation complete');
  } else {
    console.log('⚠️  Some files or directories are missing');
  }

  console.log('📝 Progress tracked successfully');
  console.log('🔄 Starting nodemon...\n');

} catch (error) {
  console.error('❌ Error tracking progress:', error.message);
  // Don't exit with error to allow nodemon to start
}

// Exit successfully to allow the next command (nodemon) to run
process.exit(0);
