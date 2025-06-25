/**
 * Simple database connectivity test for JustPing
 */

const knex = require('knex');

// Load environment-specific .env file
require('dotenv').config({ path: `./${process.env.NODE_ENV || 'local'}.env` });

const { getDbConfig } = require('../system/config/database');

async function simpleDbTest() {
  console.log('🔍 Simple Database Test');
  console.log('=======================');
  
  const env = process.env.NODE_ENV || 'local';
  console.log(`Using environment: ${env}`);
  
  let db;
  
  try {
    // Get database configuration
    const dbConfig = getDbConfig();
    
    console.log('📋 Database Configuration:');
    console.log(`  Host: ${dbConfig.host || 'Not set'}`);
    console.log(`  Port: ${dbConfig.port || 'Not set'}`);
    console.log(`  Database: ${dbConfig.database || 'Not set'}`);
    console.log(`  User: ${dbConfig.user || 'Not set'}`);
    console.log(`  SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
    
    // Check if essential config is present
    if (!dbConfig.host || !dbConfig.database || !dbConfig.user) {
      console.log('❌ Missing required database configuration');
      console.log('Please check your .env file and ensure the following variables are set:');
      console.log('  - DB_HOST');
      console.log('  - DB_NAME');
      console.log('  - DB_USER');
      console.log('  - DB_PASSWORD');
      return;
    }
    
    // Create database connection
    console.log('\n🔌 Testing connection...');
    db = knex({
      client: 'pg',
      connection: dbConfig,
      pool: { min: 1, max: 1 }
    });
    
    // Test the connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await db.raw('SELECT NOW() as current_time');
    console.log('📅 Server time:', result.rows[0].current_time);
      // Quick table check
    console.log('\n📋 Quick table check...');
    try {
      const businessCount = await db('business').count('* as count').first();
      console.log(`✅ Business table: ${businessCount.count} records`);
    } catch (e) {
      console.log('⚠️  Business table:', e.message);
    }
    
    // Close connection
    await db.destroy();
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log('Error details:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 This usually means the database host is incorrect or unreachable');
    } else if (error.message.includes('authentication')) {
      console.log('💡 This usually means the username or password is incorrect');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 The specified database does not exist');
    }
    
    if (db) {
      await db.destroy();
    }
    process.exit(1);
  }
}

simpleDbTest();
