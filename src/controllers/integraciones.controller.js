const bcrypt = require('bcryptjs');
const { getConnection, sql } = require('../config/db');
const { obtenerAgentePorMenorCarga } = require('./reglas.controller');
const { enviarCorreo } = require('../config/mailer');
const { bienvenidaClienteTemplate, ticketCreadoTemplate } = require('../config/emailTemplates');

// =============================================
// TICKET DESDE GOOGLE FORMS
// =============================================

const ticketDesdeForm = async (req, res) => {
  const { titulo, descripcion, nombre_categoria, email, nombre, apellido, telefono } = req.body;

  if (!titulo || !descripcion || !nombre_categoria || !email || !nombre || !apellido) {
    return res.status(400).json({
      mensaje: 'titulo, descripcion, nombre_categoria, email, nombre y apellido son requeridos.'
    });
  }

  try {
    const pool = await getConnection();

    // Buscar categoría por nombre
    const categoriaResult = await pool.request()
      .input('nombre', sql.VarChar, nombre_categoria)
      .query('SELECT id, prioridad_default FROM Categorias WHERE nombre = @nombre AND activo = 1');

    if (categoriaResult.recordset.length === 0) {
      return res.status(400).json({ mensaje: `La categoría "${nombre_categoria}" no existe o está deshabilitada.` });
    }

    const id_categoria = categoriaResult.recordset[0].id;
    const prioridad    = categoriaResult.recordset[0].prioridad_default;

    // Buscar o crear el usuario cliente por email
    let id_cliente;
    const usuarioResult = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT id FROM Usuarios WHERE email = @email');

    if (usuarioResult.recordset.length > 0) {
      // El cliente ya existe
      id_cliente = usuarioResult.recordset[0].id;
    } else {
      // Crear el cliente automáticamente
      const rolResult = await pool.request()
        .input('nombre', sql.VarChar, 'cliente')
        .query('SELECT id FROM Roles WHERE nombre = @nombre');

      const id_rol    = rolResult.recordset[0].id;
      const password  = await bcrypt.hash(email, 10); // password temporal = su email hasheado

      const nuevoUsuario = await pool.request()
        .input('nombre', sql.VarChar, nombre)
        .input('apellido', sql.VarChar, apellido)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, password)
        .input('telefono', sql.VarChar, telefono || null)
        .input('id_rol', sql.UniqueIdentifier, id_rol)
        .query(`
          INSERT INTO Usuarios (id, nombre, apellido, email, password, telefono, id_rol)
          OUTPUT INSERTED.id
          VALUES (NEWID(), @nombre, @apellido, @email, @password, @telefono, @id_rol)
        `);

      id_cliente = nuevoUsuario.recordset[0].id;

      // Enviar email de bienvenida con credenciales temporales
      try {
        await enviarCorreo({
          para: email,
          asunto: 'Bienvenido al Sistema de Tickets — Servicios Integrales S.A.',
          html: bienvenidaClienteTemplate({ nombre, email, password: email }),
        });
      } catch (mailError) {
        console.error('Error al enviar email de bienvenida (forms):', mailError);
      }
    }

    // Asignación automática por menor carga
    const id_agente = await obtenerAgentePorMenorCarga(pool, id_categoria, prioridad);

    // Crear el ticket
    const ticketResult = await pool.request()
      .input('titulo', sql.VarChar, titulo)
      .input('descripcion', sql.Text, descripcion)
      .input('prioridad', sql.VarChar, prioridad)
      .input('id_categoria', sql.UniqueIdentifier, id_categoria)
      .input('id_cliente', sql.UniqueIdentifier, id_cliente)
      .input('id_agente', sql.UniqueIdentifier, id_agente)
      .input('creado_por', sql.UniqueIdentifier, id_cliente)
      .query(`
        INSERT INTO Tickets (id, titulo, descripcion, canal, prioridad, id_categoria, id_cliente, id_agente, creado_por)
        OUTPUT INSERTED.id, INSERTED.numero_legible
        VALUES (NEWID(), @titulo, @descripcion, 'forms', @prioridad, @id_categoria, @id_cliente, @id_agente, @creado_por)
      `);

    const ticket = ticketResult.recordset[0];

    // Registrar en historial
    await pool.request()
      .input('id_ticket', sql.UniqueIdentifier, ticket.id)
      .input('id_usuario', sql.UniqueIdentifier, id_cliente)
      .query(`
        INSERT INTO Historial_Tickets (id, id_ticket, id_usuario, accion, detalle)
        VALUES (NEWID(), @id_ticket, @id_usuario, 'creacion', 'Ticket creado desde Google Forms')
      `);

    if (id_agente) {
      await pool.request()
        .input('id_ticket', sql.UniqueIdentifier, ticket.id)
        .input('id_usuario', sql.UniqueIdentifier, id_cliente)
        .query(`
          INSERT INTO Historial_Tickets (id, id_ticket, id_usuario, accion, detalle)
          VALUES (NEWID(), @id_ticket, @id_usuario, 'asignacion', 'Agente asignado automáticamente por menor carga')
        `);
    }

    // Enviar email de confirmación del ticket al cliente
    try {
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
    } catch (mailError) {
      console.error('Error al enviar email de confirmación de ticket (forms):', mailError);
    }

    res.status(201).json({
      mensaje: 'Ticket creado correctamente desde Google Forms.',
      numero_legible: ticket.numero_legible,
      prioridad,
      agente_asignado: !!id_agente,
    });
  } catch (error) {
    console.error('Error en ticketDesdeForm:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { ticketDesdeForm };
