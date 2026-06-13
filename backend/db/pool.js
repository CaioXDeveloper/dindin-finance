const { Pool } = require('pg');

function getPoolConfig() {
  let connectionString = process.env.DATABASE_URL;

  if (connectionString?.includes('neon.tech') && !connectionString.includes('uselibpqcompat=')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString = `${connectionString}${separator}uselibpqcompat=true`;
  }

  const useSsl =
    process.env.NODE_ENV === 'production' || connectionString?.includes('neon.tech');

  return {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(getPoolConfig());

async function query(text, params) {
  return pool.query(text, params);
}

async function testConnection() {
  const result = await pool.query('SELECT NOW()');
  return result.rows[0].now;
}

module.exports = { pool, query, testConnection };
