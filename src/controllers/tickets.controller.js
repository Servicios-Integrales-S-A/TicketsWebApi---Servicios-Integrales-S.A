const { getConnection, sql } = require('../config/db');
const { obtenerAgentePorMenorCarga } = require('./reglas.controller');
const { enviarCorreo } = require('../config/mailer');
const { ticketCreadoTemplate } = require('../config/emailTemplates');

// =============================================
// CREAR TICKET
// =============================================

const crearTicket = async (req, res) => {
  const { titulo, descripcion, id_categoria, canal, prioridad: prioridad_manual, id_agente: id_agente_manual } = req.body;
  const { id: id_usuario, rol } = req.usuario;

  // Validaciones básicas
  if (!titulo || !descripcion || !id_categoria || !canal) {
    return res.status(400).json({ mensaje: 'titulo, descripcion, id_categoria y canal son requeridos.' });
  }

  const canalesValidos = ['web', 'chat', 'email', 'forms', 'telefono', 'presencial'];
  if (!canalesValidos.includes(canal)) {
    return res.status(400).json({ mensaje: `Canal no válido. Use: ${canalesValidos.join(', ')}.` });
  }

  // Clientes solo pueden crear tickets por web o chat
  if (rol === 'cliente' && !['web', 'chat'].includes(canal)) {
    return res.status(403).json({ mensaje: 'Los clientes solo pueden crear tickets por web o chat.' });
  }

  try {
    const pool = await getConnection();

    // Obtener categoría y su prioridad_default
    const categoriaResult = await pool.request()
      .input('id_categoria', sql.UniqueIdentifier, id_categoria)
      .query('SELECT id, nombre, prioridad_default FROM Categorias WHERE id = @id_categoria AND activo = 1');

    if (categoriaResult.recordset.length === 0) {
      return res.status(400).json({ mensaje: 'La categoría no existe o está deshabilitada.' });
    }

    // Prioridad: agente/admin pueden especificarla, cliente siempre usa la de la categoría
    const prioridadesValidas = ['critico', 'alto', 'medio', 'bajo'];
    const nombre_categoria = categoriaResult.recordset[0].nombre;
    let prioridad = categoriaResult.recordset[0].prioridad_default;

    if (prioridad_manual && rol !== 'cliente') {
      if (!prioridadesValidas.includes(prioridad_manual)) {
        return res.status(400).json({ mensaje: 'Prioridad no válida. Use: critico, alto, medio, bajo.' });
      }
      prioridad = prioridad_manual;
    }

    // Determinar el id_cliente
    // Si es cliente → él mismo
    // Si es agente o admin → id_cliente es obligatorio en el body
    let id_cliente;
    if (rol === 'cliente') {
      id_cliente = id_usuario;
    } else {
      if (!req.body.id_cliente) {
        return res.status(400).json({ mensaje: 'id_cliente es requerido cuando el ticket lo crea un agente o admin.' });
      }
      id_cliente = req.body.id_cliente;
    }

    // Verificar que el cliente exista
    if (id_cliente !== id_usuario) {
      const clienteResult = await pool.request()
        .input('id_cliente', sql.UniqueIdentifier, id_cliente)
        .query(`
          SELECT u.id FROM Usuarios u
          INNER JOIN Roles r ON r.id = u.id_rol
          WHERE u.id = @id_cliente AND r.nombre = 'cliente' AND u.activo = 1
        `);

      if (clienteResult.recordset.length === 0) {
        return res.status(400).json({ mensaje: 'El cliente no existe o no tiene rol cliente.' });
      }
    }

    // Determinar el agente asignado
    let id_agente = null;

    if (id_agente_manual && rol !== 'cliente') {
      // Admin o agente especificó el agente manualmente
      const agenteResult = await pool.request()
        .input('id_agente', sql.UniqueIdentifier, id_agente_manual)
        .query(`
          SELECT u.id FROM Usuarios u
          INNER JOIN Roles r ON r.id = u.id_rol
          WHERE u.id = @id_agente AND r.nombre = 'agente' AND u.activo = 1
        `);

      if (agenteResult.recordset.length === 0) {
        return res.status(400).json({ mensaje: 'El agente no existe o no tiene rol agente.' });
      }

      id_agente = id_agente_manual;
    } else {
      // Asignación automática por menor carga
      id_agente = await obtenerAgentePorMenorCarga(pool, id_categoria, prioridad);
    }

    // Crear el ticket
    const ticketResult = await pool.request()
      .input('titulo', sql.VarChar, titulo)
      .input('descripcion', sql.Text, descripcion)
      .input('canal', sql.VarChar, canal)
      .input('prioridad', sql.VarChar, prioridad)
      .input('id_categoria', sql.UniqueIdentifier, id_categoria)
      .input('id_cliente', sql.UniqueIdentifier, id_cliente)
      .input('id_agente', sql.UniqueIdentifier, id_agente)
      .input('creado_por', sql.UniqueIdentifier, id_usuario)
      .query(`
        INSERT INTO Tickets (id, titulo, descripcion, canal, prioridad, id_categoria, id_cliente, id_agente, creado_por)
        OUTPUT INSERTED.id, INSERTED.numero_legible
        VALUES (NEWID(), @titulo, @descripcion, @canal, @prioridad, @id_categoria, @id_cliente, @id_agente, @creado_por)
      `);

    const ticket = ticketResult.recordset[0];

    // Registrar creación en historial
    await pool.request()
      .input('id_ticket', sql.UniqueIdentifier, ticket.id)
      .input('id_usuario', sql.UniqueIdentifier, id_usuario)
      .query(`
        INSERT INTO Historial_Tickets (id, id_ticket, id_usuario, accion, detalle)
        VALUES (NEWID(), @id_ticket, @id_usuario, 'creacion', 'Ticket creado')
      `);

    // Registrar asignación en historial si se asignó agente
    if (id_agente) {
      const detalle = id_agente_manual
        ? 'Agente asignado manualmente'
        : 'Agente asignado automáticamente por menor carga';

      await pool.request()
        .input('id_ticket', sql.UniqueIdentifier, ticket.id)
        .input('id_usuario', sql.UniqueIdentifier, id_usuario)
        .input('detalle', sql.VarChar, detalle)
        .query(`
          INSERT INTO Historial_Tickets (id, id_ticket, id_usuario, accion, detalle)
          VALUES (NEWID(), @id_ticket, @id_usuario, 'asignacion', @detalle)
        `);
    }

    // Enviar email de confirmación al cliente
    try {
      const clienteData = await pool.request()
        .input('id_cliente', sql.UniqueIdentifier, id_cliente)
        .query('SELECT nombre, email FROM Usuarios WHERE id = @id_cliente');

      if (clienteData.recordset.length > 0) {
        const { nombre, email } = clienteData.recordset[0];
        await enviarCorreo({
          para: email,
          asunto: `Ticket ${ticket.numero_legible} registrado — Servicios Integrales S.A.`,
          html: ticketCreadoTemplate({
            nombre,
            numero_legible: ticket.numero_legible,
            titulo,
            descripcion,
            categoria: nombre_categoria,
            agente_asignado: !!id_agente,
          }),
        });
      }
    } catch (mailError) {
      console.error('Error al enviar email de confirmación de ticket:', mailError);
    }

    res.status(201).json({
      mensaje: 'Ticket creado correctamente.',
      id: ticket.id,
      numero_legible: ticket.numero_legible,
      prioridad,
      asignado_automaticamente: !!id_agente && !id_agente_manual,
      agente_asignado: !!id_agente,
    });
  } catch (error) {
    console.error('Error en crearTicket:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { crearTicket };
