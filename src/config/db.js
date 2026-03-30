const sql = require('mssql');
require('dotenv').config();

const pool = new sql.ConnectionPool(process.env.DB_CONNECTION_STRING);
const poolConnect = pool.connect();

pool.on('error', (err) => {
  console.error('Error en el pool de conexiones:', err);
});

const getConnection = async () => {
  await poolConnect;
  return pool;
};

module.exports = { getConnection, sql };
