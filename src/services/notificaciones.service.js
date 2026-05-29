const { sql } = require('../config/db');

const crearNotificacion = async (pool, id_usuario, tipo, titulo, mensaje, id_ticket = null) => {
  await pool.request()
    .input('id_usuario', sql.UniqueIdentifier, id_usuario)
    .input('tipo',       sql.VarChar,          tipo)
    .input('titulo',     sql.VarChar,          titulo)
    .input('mensaje',    sql.VarChar,          mensaje)
    .input('id_ticket',  sql.UniqueIdentifier, id_ticket)
    .query(`
      INSERT INTO Notificaciones (id, id_usuario, tipo, titulo, mensaje, id_ticket)
      VALUES (NEWID(), @id_usuario, @tipo, @titulo, @mensaje, @id_ticket)
    `);
};

const notificarAdmins = async (pool, tipo, titulo, mensaje, id_ticket = null, excluir_id = null) => {
  const admins = await pool.request().query(`
    SELECT u.id FROM Usuarios u
    INNER JOIN Roles r ON r.id = u.id_rol
    WHERE r.nombre = 'admin' AND u.activo = 1
  `);
  for (const admin of admins.recordset) {
    // No notificar al admin que originó la acción
    if (excluir_id && admin.id === excluir_id) continue;
    await crearNotificacion(pool, admin.id, tipo, titulo, mensaje, id_ticket);
  }
};

module.exports = { crearNotificacion, notificarAdmins };
