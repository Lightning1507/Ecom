const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Determine the correct path to the .env file
const envPath = path.resolve(__dirname, '../.env'); // Go up one directory
const localEnvPath = path.resolve(__dirname, '.env'); // Look in current directory

let dotenvPath = fs.existsSync(envPath) ? envPath : localEnvPath;
console.log(`Using .env file at: ${dotenvPath}`);

// Load environment variables
require('dotenv').config({ path: dotenvPath });

// Debug information
console.log('Database configuration:');
console.log('- DB_USER:', process.env.DB_USER ? '✓ Set' : '✗ Not set');
console.log('- DB_HOST:', process.env.DB_HOST ? '✓ Set' : '✗ Not set');
console.log('- DB_NAME:', process.env.DB_NAME ? '✓ Set' : '✗ Not set');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ Set' : '✗ Not set');
console.log('- DB_PORT:', process.env.DB_PORT ? '✓ Set' : '✗ Not set');

// Create database connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10)
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
    console.error('Please check your database configuration and credentials');
    
    if (err.code === 'ECONNREFUSED') {
      console.error('PostgreSQL server is not running or not accessible');
    } else if (err.code === '3D000') {
      console.error(`Database "${process.env.DB_NAME}" does not exist`);
    }
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = pool;