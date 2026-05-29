const sql = require('mssql');
require('dotenv').config();

const pool = new sql.ConnectionPool(process.env.DB_CONNECTION_STRING);

// Zona horaria: SQL Server guarda las fechas en hora local (GETDATE() => hora de
// Guatemala, UTC-6). Por defecto el driver las lee como si fueran UTC (useUTC: true),
// lo que provocaba un desfase de 6 horas al mostrarlas en el frontend.
// Forzamos useUTC: false para que las fechas se lean/escriban en la hora local del
// proceso Node (misma zona que el servidor SQL).
// Nota: no se puede setear vía connection string porque mssql hace `useUTC: !!value`
// y `!!"false"` es true, así que se asigna directo sobre la config ya parseada.
pool.config.options = pool.config.options || {};
pool.config.options.useUTC = false;

const poolConnect = pool.connect();

pool.on('error', (err) => {
  console.error('Error en el pool de conexiones:', err);
});

const getConnection = async () => {
  await poolConnect;
  return pool;
};

module.exports = { getConnection, sql };
