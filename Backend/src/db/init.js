require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const run = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    console.log('Schema applied successfully: users, vendors, customers tables are ready.');
  } catch (err) {
    console.error('Failed to apply schema:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
