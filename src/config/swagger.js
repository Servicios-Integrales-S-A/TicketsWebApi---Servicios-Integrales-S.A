const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Tickets — Servicios Integrales S.A.',
    version: '1.0.0',
    description:
      'API REST para la gestión de tickets de soporte. Permite crear y gestionar tickets desde múltiples canales (web, chat, email, forms, teléfono, presencial), con asignación automática de agentes y seguimiento completo del ciclo de vida.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en POST /api/auth/login',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API Key para integraciones externas (Google Forms)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { mensaje: { type: 'string', example: 'Error interno del servidor.' } },
      },
      Paginacion: {
        type: 'object',
        properties: {
          total:   { type: 'integer', example: 25 },
          pagina:  { type: 'integer', example: 1 },
          limit:   { type: 'integer', example: 10 },
          paginas: { type: 'integer', example: 3 },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id:       { type: 'string', format: 'uuid' },
          nombre:   { type: 'string', example: 'Juan' },
          apellido: { type: 'string', example: 'García' },
          email:    { type: 'string', example: 'juan@example.com' },
          telefono: { type: 'string', example: '5512345678' },
          rol:      { type: 'string', example: 'cliente' },
          activo:   { type: 'boolean', example: true },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          id:             { type: 'string', format: 'uuid' },
          numero_legible: { type: 'string', example: 'TK-0001' },
          titulo:         { type: 'string', example: 'No puedo iniciar sesión' },
          descripcion:    { type: 'string', example: 'Me aparece error 403 al intentar entrar.' },
          estado:         { type: 'string', example: 'abierto',  enum: ['abierto', 'en_progreso', 'resuelto', 'cerrado'] },
          prioridad:      { type: 'string', example: 'medio',    enum: ['bajo', 'medio', 'alto', 'critico'] },
          canal:          { type: 'string', example: 'web',      enum: ['web', 'chat', 'email', 'forms', 'telefono', 'presencial'] },
          categoria:      { type: 'string', example: 'Acceso y autenticación' },
          cliente:        { type: 'string', example: 'Juan García' },
          agente:         { type: 'string', example: 'María López' },
          creado_en:      { type: 'string', format: 'date-time' },
          fecha_cierre:   { type: 'string', format: 'date-time' },
        },
      },
      Nota: {
        type: 'object',
        properties: {
          id:         { type: 'string', format: 'uuid' },
          contenido:  { type: 'string', example: 'El cliente confirmó que ya puede acceder.' },
          es_interna: { type: 'boolean', example: false },
          autor:      { type: 'string', example: 'María López' },
          creado_en:  { type: 'string', format: 'date-time' },
        },
      },
      Historial: {
        type: 'object',
        properties: {
          id:      { type: 'string', format: 'uuid' },
          accion:  { type: 'string', example: 'cambio_estado' },
          detalle: { type: 'string', example: 'Estado cambiado de "abierto" a "en_progreso"' },
          usuario: { type: 'string', example: 'María López' },
          fecha:   { type: 'string', format: 'date-time' },
        },
      },
      Categoria: {
        type: 'object',
        properties: {
          id:                { type: 'string', format: 'uuid' },
          nombre:            { type: 'string', example: 'Acceso y autenticación' },
          descripcion:       { type: 'string', example: 'Problemas de login y permisos' },
          prioridad_default: { type: 'string', example: 'medio', enum: ['bajo', 'medio', 'alto', 'critico'] },
          activo:            { type: 'boolean', example: true },
        },
      },
      Regla: {
        type: 'object',
        properties: {
          id:           { type: 'string', format: 'uuid' },
          categoria:    { type: 'string', example: 'Acceso y autenticación' },
          prioridad:    { type: 'string', example: 'alto', enum: ['bajo', 'medio', 'alto', 'critico'] },
          agente:       { type: 'string', example: 'María López' },
          activo:       { type: 'boolean', example: true },
          creado_en:    { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth',          description: 'Autenticación y recuperación de contraseña' },
    { name: 'Usuarios',      description: 'Gestión de usuarios y perfiles' },
    { name: 'Categorias',    description: 'Categorías de tickets' },
    { name: 'Reglas',        description: 'Reglas de asignación automática' },
    { name: 'Tickets',       description: 'Creación y gestión de tickets' },
    { name: 'Notas',         description: 'Notas e historial de tickets' },
    { name: 'Integraciones', description: 'Endpoints para integraciones externas (Google Forms)' },
  ],
  paths: {

    // ─── AUTH ───────────────────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar nuevo usuario (público) — crea cuenta con rol cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'apellido', 'email', 'password'],
                properties: {
                  nombre:   { type: 'string', example: 'Juan' },
                  apellido: { type: 'string', example: 'García' },
                  email:    { type: 'string', example: 'juan@example.com' },
                  password: { type: 'string', example: 'MiClave123' },
                  telefono: { type: 'string', example: '55512345678' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario registrado exitosamente' },
          409: { description: 'El email ya está registrado' },
          400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión y obtener token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', example: 'admin@empresa.com' },
                  password: { type: 'string', example: 'Admin1234' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token:   { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                    usuario: { $ref: '#/components/schemas/Usuario' },
                  },
                },
              },
            },
          },
          401: { description: 'Credenciales inválidas' },
          403: { description: 'Usuario deshabilitado' },
        },
      },
    },

    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar código de restablecimiento de contraseña (enviado al email)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', example: 'juan@example.com' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Respuesta genérica (no revela si el email existe)' },
        },
      },
    },

    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Restablecer contraseña usando el código de 6 dígitos recibido por email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'token', 'password_nuevo'],
                properties: {
                  email:          { type: 'string', example: 'juan@example.com' },
                  token:          { type: 'string', example: '482910', description: 'Código de 6 dígitos recibido por email' },
                  password_nuevo: { type: 'string', example: 'NuevaClave456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña restablecida correctamente' },
          400: { description: 'Token inválido o expirado' },
        },
      },
    },

    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cerrar sesión (invalida el token actual en la blacklist)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Sesión cerrada correctamente' },
          401: { description: 'Token inválido o ausente' },
        },
      },
    },

    // ─── USUARIOS ────────────────────────────────────────────────────────────
    '/api/usuarios/perfil': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil del usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
        },
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar perfil propio (nombre, apellido y/o teléfono)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre:   { type: 'string', example: 'Juan' },
                  apellido: { type: 'string', example: 'García' },
                  telefono: { type: 'string', example: '55512345678' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Perfil actualizado' },
          400: { description: 'Debe enviar al menos un campo' },
        },
      },
    },

    '/api/usuarios/perfil/cambiar-password': {
      put: {
        tags: ['Usuarios'],
        summary: 'Cambiar contraseña del usuario autenticado',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password_actual', 'password_nuevo'],
                properties: {
                  password_actual: { type: 'string', example: 'MiClave123' },
                  password_nuevo:  { type: 'string', example: 'NuevaClave456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña actualizada' },
          401: { description: 'La contraseña actual es incorrecta' },
        },
      },
    },

    '/api/usuarios/agentes': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar agentes activos (para asignar en tickets)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de agentes activos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id:       { type: 'string', format: 'uuid' },
                      nombre:   { type: 'string' },
                      apellido: { type: 'string' },
                      email:    { type: 'string' },
                      telefono: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar todos los usuarios — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'rol',    in: 'query', schema: { type: 'string', enum: ['admin', 'agente', 'cliente'] } },
          { name: 'activo', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'search', in: 'query', description: 'Busca en nombre, apellido o email', schema: { type: 'string', example: 'juan' } },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Lista paginada de usuarios' },
          403: { description: 'Acceso denegado' },
        },
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario — admin puede crear admin/agente/cliente; agente solo puede crear cliente',
        description: 'Se envía email de bienvenida con credenciales al cliente creado. La contraseña es generada por quien crea el usuario.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'apellido', 'email', 'password', 'rol'],
                properties: {
                  nombre:   { type: 'string', example: 'Carlos' },
                  apellido: { type: 'string', example: 'Pérez' },
                  email:    { type: 'string', example: 'carlos@example.com' },
                  password: { type: 'string', example: 'Temporal123', description: 'Contraseña temporal asignada por el creador' },
                  telefono: { type: 'string', example: '55512345678' },
                  rol:      { type: 'string', enum: ['admin', 'agente', 'cliente'], example: 'cliente', description: 'Nombre del rol. Agentes solo pueden usar "cliente".' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario creado. Se envía email de bienvenida al cliente.' },
          400: { description: 'Datos inválidos' },
          403: { description: 'Acceso denegado o rol no permitido' },
          409: { description: 'El email ya está registrado' },
        },
      },
    },

    '/api/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Datos del usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          404: { description: 'Usuario no encontrado' },
        },
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar datos de un usuario — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre:   { type: 'string', example: 'Carlos' },
                  apellido: { type: 'string', example: 'Pérez' },
                  telefono: { type: 'string', example: '55512345678' },
                  rol:      { type: 'string', enum: ['admin', 'agente', 'cliente'], example: 'agente' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuario actualizado' },
          400: { description: 'Rol inválido o sin campos para actualizar' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },

    '/api/usuarios/{id}/reset-password': {
      put: {
        tags: ['Usuarios'],
        summary: 'Resetear contraseña de un usuario manualmente — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password_nuevo'],
                properties: {
                  password_nuevo: { type: 'string', example: 'NuevaClave456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña restablecida correctamente' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },

    '/api/usuarios/{id}/toggle-activo': {
      put: {
        tags: ['Usuarios'],
        summary: 'Activar o desactivar un usuario — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Estado de activación cambiado' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },

    // ─── CATEGORIAS ──────────────────────────────────────────────────────────
    '/api/categorias': {
      get: {
        tags: ['Categorias'],
        summary: 'Listar categorías (activas por defecto; admin puede ver todas)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'activo', in: 'query', description: 'Solo admin', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'search', in: 'query', description: 'Busca en nombre y descripción', schema: { type: 'string' } },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Lista paginada de categorías', content: { 'application/json': { schema: { type: 'object', properties: { datos: { type: 'array', items: { $ref: '#/components/schemas/Categoria' } }, paginacion: { $ref: '#/components/schemas/Paginacion' } } } } } },
        },
      },
      post: {
        tags: ['Categorias'],
        summary: 'Crear categoría — solo admin',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre'],
                properties: {
                  nombre:            { type: 'string', example: 'Acceso y autenticación' },
                  descripcion:       { type: 'string', example: 'Problemas de login y permisos' },
                  prioridad_default: { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'], default: 'bajo', example: 'medio' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Categoría creada' },
          400: { description: 'Datos inválidos' },
          409: { description: 'Ya existe una categoría con ese nombre' },
        },
      },
    },

    '/api/categorias/{id}': {
      get: {
        tags: ['Categorias'],
        summary: 'Obtener categoría por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Datos de la categoría', content: { 'application/json': { schema: { $ref: '#/components/schemas/Categoria' } } } },
          404: { description: 'Categoría no encontrada' },
        },
      },
      put: {
        tags: ['Categorias'],
        summary: 'Actualizar categoría — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre:            { type: 'string' },
                  descripcion:       { type: 'string' },
                  prioridad_default: { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Categoría actualizada' },
          404: { description: 'Categoría no encontrada' },
          409: { description: 'Ya existe una categoría con ese nombre' },
        },
      },
    },

    '/api/categorias/{id}/toggle-activo': {
      put: {
        tags: ['Categorias'],
        summary: 'Activar o desactivar categoría — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Estado de activación cambiado' },
          404: { description: 'Categoría no encontrada' },
        },
      },
    },

    // ─── REGLAS ──────────────────────────────────────────────────────────────
    '/api/reglas': {
      get: {
        tags: ['Reglas'],
        summary: 'Listar reglas de asignación — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'activo',      in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'id_categoria',in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'prioridad',   in: 'query', schema: { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'] } },
          { name: 'page',        in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',       in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Lista paginada de reglas', content: { 'application/json': { schema: { type: 'object', properties: { datos: { type: 'array', items: { $ref: '#/components/schemas/Regla' } }, paginacion: { $ref: '#/components/schemas/Paginacion' } } } } } },
        },
      },
      post: {
        tags: ['Reglas'],
        summary: 'Crear regla de asignación — solo admin',
        description: 'Define qué agente recibe tickets de cierta categoría y prioridad. Si hay varias reglas para la misma combinación, el sistema asigna al agente con menor carga.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_categoria', 'prioridad', 'id_agente'],
                properties: {
                  id_categoria: { type: 'string', format: 'uuid', description: 'UUID de la categoría activa' },
                  prioridad:    { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'], example: 'alto' },
                  id_agente:    { type: 'string', format: 'uuid', description: 'UUID del agente activo' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Regla creada' },
          400: { description: 'Categoría o agente inválido / prioridad no válida' },
          409: { description: 'Ya existe una regla para este agente con esa categoría y prioridad' },
        },
      },
    },

    '/api/reglas/{id}': {
      get: {
        tags: ['Reglas'],
        summary: 'Obtener regla por ID — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Datos de la regla', content: { 'application/json': { schema: { $ref: '#/components/schemas/Regla' } } } },
          404: { description: 'Regla no encontrada' },
        },
      },
      put: {
        tags: ['Reglas'],
        summary: 'Actualizar regla — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id_categoria: { type: 'string', format: 'uuid' },
                  prioridad:    { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'] },
                  id_agente:    { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Regla actualizada' },
          400: { description: 'Agente o prioridad inválida' },
          404: { description: 'Regla no encontrada' },
          409: { description: 'Combinación duplicada' },
        },
      },
      delete: {
        tags: ['Reglas'],
        summary: 'Eliminar regla — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Regla eliminada' },
          404: { description: 'Regla no encontrada' },
        },
      },
    },

    '/api/reglas/{id}/toggle-activo': {
      put: {
        tags: ['Reglas'],
        summary: 'Activar o desactivar regla — solo admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Estado de activación cambiado' },
          404: { description: 'Regla no encontrada' },
        },
      },
    },

    // ─── TICKETS ─────────────────────────────────────────────────────────────
    '/api/tickets': {
      get: {
        tags: ['Tickets'],
        summary: 'Listar tickets con filtros y paginación',
        description: [
          '**Visibilidad por rol:**',
          '- **cliente**: solo sus propios tickets.',
          '- **agente**: tickets asignados a él.',
          '- **admin**: todos los tickets.',
          '',
          '**Filtros disponibles** (todos opcionales):',
          '`estado`, `prioridad`, `canal`, `id_categoria`, `id_cliente` (agente/admin), `id_agente` (admin), `buscar` (título/número), `buscar_cliente` (nombre/apellido/email, agente/admin), `buscar_agente` (solo admin).',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'estado',         in: 'query', schema: { type: 'string', enum: ['abierto', 'en_progreso', 'resuelto', 'cerrado'] } },
          { name: 'prioridad',      in: 'query', schema: { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'] } },
          { name: 'canal',          in: 'query', schema: { type: 'string', enum: ['web', 'chat', 'email', 'forms', 'telefono', 'presencial'] } },
          { name: 'id_categoria',   in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'id_cliente',     in: 'query', description: 'Solo agente/admin', schema: { type: 'string', format: 'uuid' } },
          { name: 'id_agente',      in: 'query', description: 'Solo admin', schema: { type: 'string', format: 'uuid' } },
          { name: 'buscar',         in: 'query', description: 'Busca en título y número de ticket', schema: { type: 'string', example: 'TK-00' } },
          { name: 'buscar_cliente', in: 'query', description: 'Busca por nombre, apellido o email del cliente (agente/admin)', schema: { type: 'string', example: 'juan' } },
          { name: 'buscar_agente',  in: 'query', description: 'Busca por nombre, apellido o email del agente (solo admin)', schema: { type: 'string', example: 'maria' } },
          { name: 'page',           in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',          in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Lista paginada de tickets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    datos:      { type: 'array', items: { $ref: '#/components/schemas/Ticket' } },
                    paginacion: { $ref: '#/components/schemas/Paginacion' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Tickets'],
        summary: 'Crear ticket',
        description: [
          '**Campos automáticos**: `numero_legible`, `estado` (abierto), `id_agente` (por reglas/menor carga), `creado_por`.',
          '',
          '**Canal**: `web`, `chat`, `email`, `forms`, `telefono`, `presencial`. Los clientes solo pueden usar `web` o `chat`.',
          '',
          '**prioridad**: opcional para agente/admin; el cliente siempre usa la `prioridad_default` de la categoría. Valores: `bajo`, `medio`, `alto`, `critico`.',
          '',
          '**id_cliente**: obligatorio para agente/admin. El cliente autenticado no lo envía (el sistema usa su ID).',
          '',
          '**id_agente**: opcional para agente/admin (asignación manual). Si se omite, se asigna automáticamente por menor carga.',
          '',
          'Al crear el ticket se envía un email de confirmación al cliente.',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titulo', 'descripcion', 'id_categoria', 'canal'],
                properties: {
                  titulo:       { type: 'string', example: 'No puedo iniciar sesión' },
                  descripcion:  { type: 'string', example: 'Me aparece error 403 al intentar entrar.' },
                  id_categoria: { type: 'string', format: 'uuid' },
                  canal:        { type: 'string', enum: ['web', 'chat', 'email', 'forms', 'telefono', 'presencial'], example: 'web' },
                  prioridad:    { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'], description: 'Opcional. Solo agente/admin pueden especificarlo.' },
                  id_cliente:   { type: 'string', format: 'uuid', description: 'Obligatorio para agente/admin.' },
                  id_agente:    { type: 'string', format: 'uuid', description: 'Opcional. Si se omite, se asigna automáticamente.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ticket creado exitosamente' },
          400: { description: 'Datos inválidos / id_cliente requerido para agente-admin' },
          403: { description: 'Canal no permitido para clientes' },
        },
      },
    },

    '/api/tickets/{id}': {
      get: {
        tags: ['Tickets'],
        summary: 'Obtener detalle completo de un ticket',
        description: 'El cliente solo puede ver sus propios tickets. El agente solo los tickets asignados a él.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Detalle del ticket', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } } },
          403: { description: 'Sin permiso para ver este ticket' },
          404: { description: 'Ticket no encontrado' },
        },
      },
    },

    '/api/tickets/{id}/estado': {
      put: {
        tags: ['Tickets'],
        summary: 'Cambiar estado del ticket — agente/admin',
        description: 'Estados válidos: `abierto`, `en_progreso`, `resuelto`, `cerrado`. Al cambiar a `cerrado` se registra `fecha_cierre`.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estado'],
                properties: {
                  estado: { type: 'string', enum: ['abierto', 'en_progreso', 'resuelto', 'cerrado'], example: 'en_progreso' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Estado actualizado' },
          400: { description: 'Estado inválido o igual al actual' },
          404: { description: 'Ticket no encontrado' },
        },
      },
    },

    '/api/tickets/{id}/asignar': {
      put: {
        tags: ['Tickets'],
        summary: 'Asignar o reasignar agente al ticket — agente/admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_agente'],
                properties: {
                  id_agente: { type: 'string', format: 'uuid', description: 'UUID de un usuario con rol agente activo' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Agente asignado' },
          400: { description: 'El usuario no existe o no tiene rol agente' },
          404: { description: 'Ticket no encontrado' },
        },
      },
    },

    '/api/tickets/{id}/prioridad': {
      put: {
        tags: ['Tickets'],
        summary: 'Cambiar prioridad del ticket — agente/admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prioridad'],
                properties: {
                  prioridad: { type: 'string', enum: ['bajo', 'medio', 'alto', 'critico'], example: 'alto' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Prioridad actualizada' },
          400: { description: 'Prioridad inválida o igual a la actual' },
          404: { description: 'Ticket no encontrado' },
        },
      },
    },

    // ─── NOTAS ───────────────────────────────────────────────────────────────
    '/api/tickets/{id}/notas': {
      get: {
        tags: ['Notas'],
        summary: 'Listar notas de un ticket',
        description: 'Los clientes solo ven notas públicas (`es_interna: false`). Los agentes y admins ven todas.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, description: 'ID del ticket', schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Lista de notas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Nota' } } } } },
          403: { description: 'Sin permiso para ver este ticket' },
          404: { description: 'Ticket no encontrado' },
        },
      },
      post: {
        tags: ['Notas'],
        summary: 'Agregar nota a un ticket',
        description: [
          'Cualquier usuario con acceso al ticket puede agregar una nota.',
          '`es_interna: true` hace la nota visible solo para agentes/admins. Para clientes este campo se ignora siempre.',
          'Si un agente agrega una nota pública, se envía notificación por email al cliente.',
          'Las notas no se pueden editar ni eliminar.',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, description: 'ID del ticket', schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['contenido'],
                properties: {
                  contenido:  { type: 'string', example: 'El cliente confirmó que ya puede acceder.' },
                  es_interna: { type: 'boolean', example: false, description: 'true = nota interna. Ignorado para clientes.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Nota agregada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Nota' } } } },
          403: { description: 'Sin permiso para acceder a este ticket' },
          404: { description: 'Ticket no encontrado' },
        },
      },
    },

    '/api/tickets/{id}/historial': {
      get: {
        tags: ['Notas'],
        summary: 'Ver historial de eventos del ticket',
        description: 'Registro cronológico de todas las acciones: creación, cambios de estado, asignaciones, cambios de prioridad y notas.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, description: 'ID del ticket', schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Lista de eventos del historial', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Historial' } } } } },
          403: { description: 'Sin permiso para ver este ticket' },
          404: { description: 'Ticket no encontrado' },
        },
      },
    },

    // ─── INTEGRACIONES ───────────────────────────────────────────────────────
    '/api/integraciones/forms': {
      post: {
        tags: ['Integraciones'],
        summary: 'Crear ticket desde Google Forms (API Key requerida)',
        description: [
          'Endpoint para integración con Google Forms vía Google Apps Script.',
          'Requiere el header `x-api-key` con la clave configurada en `.env`.',
          'Si el email no existe en la DB, se crea automáticamente un usuario cliente y se envía email de bienvenida.',
          'El agente se asigna automáticamente por reglas (menor carga).',
        ].join('\n'),
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titulo', 'descripcion', 'nombre_categoria', 'email', 'nombre', 'apellido'],
                properties: {
                  titulo:           { type: 'string', example: 'Problema con facturación' },
                  descripcion:      { type: 'string', example: 'No puedo descargar mi factura de marzo.' },
                  nombre_categoria: { type: 'string', example: 'Facturación', description: 'Nombre exacto de una categoría activa en el sistema' },
                  email:            { type: 'string', example: 'juan@example.com' },
                  nombre:           { type: 'string', example: 'Juan' },
                  apellido:         { type: 'string', example: 'García' },
                  telefono:         { type: 'string', example: '55512345678' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ticket creado desde el formulario' },
          400: { description: 'Categoría no encontrada o datos inválidos' },
          401: { description: 'API Key inválida o ausente' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
