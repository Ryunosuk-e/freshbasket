const { Pool } = require('pg');
require('dotenv').config();

// A single shared connection pool. Every model file imports this instead of
// opening its own connection, so the app reuses a small set of live
// connections instead of opening a new one per query.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  // Fires if an idle client in the pool throws an error (e.g. the DB
  // restarts). Logging and exiting is safer than limping along with a
  // broken pool.
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

module.exports = pool;
