const sql = require('mssql/msnodesqlv8');

const dbConfig = {
  server: 'localhost',
  database: 'DuLieu',
  driver: 'ODBC Driver 18 for SQL Server',
  options: {
    instanceName: 'SQLEXPRESS',
    trustedConnection: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

module.exports = { sql, dbConfig, getPool };
