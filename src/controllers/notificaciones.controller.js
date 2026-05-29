const { getConnection, sql } = require('../config/db');

// =============================================
// LISTAR NOTIFICACIONES
// =============================================

const listarNotificaciones = async (req, res) => {
  const { id: id_usuario } = req.usuario;
  const { leida, page = 1, limit = 20 } = req.query;

  try {
    const pool   = await getConnection();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const request = pool.request()
      .input('id_usuario', sql.UniqueIdentifier, id_usuario)
      .input('limit',      sql.Int, parseInt(limit))
      .input('offset',     sql.Int, offset);

    const rCount = pool.request()
      .input('id_usuario', sql.UniqueIdentifier, id_usuario);

    let where = 'WHERE id_usuario = @id_usuario';
    if (leida !== undefined) {
      where += ' AND leida = @leida';
      request.input('leida', sql.Bit, leida === 'true' ? 1 : 0);
      rCount.input('leida', sql.Bit, leida === 'true' ? 1 : 0);
    }

    const totalResult = await rCount.query(
      `SELECT COUNT(*) AS total FROM Notificaciones ${where}`
    );

    const result = await request.query(`
      SELECT id, tipo, titulo, mensaje, id_ticket, leida, creado_en
      FROM Notificaciones
      ${where}
      ORDER BY creado_en DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      datos: result.recordset,
      paginacion: {
        total:   totalResult.recordset[0].total,
        pagina:  parseInt(page),
        limit:   parseInt(limit),
        paginas: Math.ceil(totalResult.recordset[0].total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error en listarNotificaciones:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// =============================================
// CONTEO DE NO LEÍDAS (para el badge del navbar)
// =============================================

const contarNoLeidas = async (req, res) => {
  const { id: id_usuario } = req.usuario;

  try {
    const pool   = await getConnection();
    const result = await pool.request()
      .input('id_usuario', sql.UniqueIdentifier, id_usuario)
      .query(`
        SELECT COUNT(*) AS total
        FROM Notificaciones
        WHERE id_usuario = @id_usuario AND leida = 0
      `);

    res.json({ total: result.recordset[0].total });
  } catch (error) {
    console.error('Error en contarNoLeidas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// =============================================
// MARCAR TODAS COMO LEÍDAS
// =============================================

const leerTodas = async (req, res) => {
  const { id: id_usuario } = req.usuario;

  try {
    const pool = await getConnection();
    await pool.request()
      .input('id_usuario', sql.UniqueIdentifier, id_usuario)
      .query(`
        UPDATE Notificaciones
        SET leida = 1
        WHERE id_usuario = @id_usuario AND leida = 0
      `);

    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) {
    console.error('Error en leerTodas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// =============================================
// MARCAR UNA COMO LEÍDA
// =============================================

const leerUna = async (req, res) => {
  const { id } = req.params;
  const { id: id_usuario } = req.usuario;

  try {
    const pool  = await getConnection();
    const existe = await pool.request()
      .input('id',         sql.UniqueIdentifier, id)
      .input('id_usuario', sql.UniqueIdentifier, id_usuario)
      .query(`
        SELECT id FROM Notificaciones
        WHERE id = @id AND id_usuario = @id_usuario
      `);

    if (existe.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Notificación no encontrada.' });
    }

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`UPDATE Notificaciones SET leida = 1 WHERE id = @id`);

    res.json({ mensaje: 'Notificación marcada como leída.' });
  } catch (error) {
    console.error('Error en leerUna:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { listarNotificaciones, contarNoLeidas, leerTodas, leerUna };
