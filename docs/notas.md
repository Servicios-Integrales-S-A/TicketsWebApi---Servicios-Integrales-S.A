# Documentación — Módulo de Notas e Historial
**Sistema de Tickets — Servicios Integrales S.A.**

---

## Descripción General

El módulo de notas permite agregar mensajes y respuestas a un ticket. Las notas pueden ser **públicas** (visibles al cliente) o **internas** (solo visibles para agentes y admins). El historial registra cronológicamente todos los eventos ocurridos en un ticket.

---

## Archivos involucrados

| Archivo | Descripción |
|---------|-------------|
| `src/controllers/notas.controller.js` | Lógica de notas e historial |
| `src/routes/tickets.routes.js` | Rutas registradas bajo `/api/tickets/:id/` |

---

## Permisos por endpoint

| Endpoint | Rol requerido |
|----------|--------------|
| `POST /api/tickets/:id/notas` | Cualquier usuario autenticado con acceso al ticket |
| `GET /api/tickets/:id/notas` | Cualquier usuario autenticado con acceso al ticket |
| `GET /api/tickets/:id/historial` | Cualquier usuario autenticado con acceso al ticket |

> Las mismas reglas de visibilidad de `GET /api/tickets/:id` aplican: el cliente solo accede a sus tickets, el agente a los asignados a él, el admin a todos.

---

## Endpoints

---

### `POST /api/tickets/:id/notas`

Agrega una nota o respuesta a un ticket.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Params:**
- `id` — UUID del ticket

**Body:**
```json
{
  "contenido": "Se revisó el equipo y se detectó fallo en la fuente de poder.",
  "es_interna": true
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `contenido` | string | Sí | Texto de la nota o respuesta |
| `es_interna` | boolean | No | `true` = nota interna privada, `false` = respuesta pública. Default: `false` |

**Comportamiento por rol:**

| Rol | `es_interna` |
|-----|-------------|
| `cliente` | Siempre `false`. El campo es ignorado aunque se envíe `true` |
| `agente` | Puede enviar `true` o `false` |
| `admin` | Puede enviar `true` o `false` |

> **Nota para frontend:** En el panel del cliente no mostrar la opción de nota interna. En el panel de agente/admin mostrar un toggle o checkbox para elegir si es interna o pública.

**Respuesta exitosa `201`:**
```json
{
  "mensaje": "Respuesta agregada correctamente.",
  "id": "uuid-de-la-nota",
  "es_interna": false,
  "creado_en": "2026-04-15T10:00:00.000Z"
}
```

> Si la nota es interna el mensaje dice `"Nota interna agregada."`.

**Efectos secundarios:**
- Se registra en `Historial_Tickets` con acción `nota_agregada`
- Se actualiza `actualizado_en` del ticket

**Respuestas de error:**

| Código | Causa |
|--------|-------|
| `400` | `contenido` vacío o no enviado |
| `401` | Token no enviado |
| `403` | Sin acceso al ticket |
| `404` | Ticket no encontrado |
| `500` | Error interno del servidor |

---

### `GET /api/tickets/:id/notas`

Lista todas las notas de un ticket.

**Headers:**
```
Authorization: Bearer <token>
```

**Params:**
- `id` — UUID del ticket

**Visibilidad:**

| Rol | Qué ve |
|-----|--------|
| `cliente` | Solo notas públicas (`es_interna = false`) |
| `agente` | Todas (públicas e internas) |
| `admin` | Todas (públicas e internas) |

**Respuesta exitosa `200`:**
```json
[
  {
    "id": "uuid-nota",
    "contenido": "Hemos recibido tu solicitud y la estamos revisando.",
    "es_interna": false,
    "creado_en": "2026-04-15T10:05:00.000Z",
    "autor": "Carlos Mendoza",
    "autor_email": "carlos@serviciosintegrales.com",
    "autor_rol": "agente"
  },
  {
    "id": "uuid-nota-2",
    "contenido": "Fallo detectado en la fuente de poder. Requiere reemplazo.",
    "es_interna": true,
    "creado_en": "2026-04-15T10:10:00.000Z",
    "autor": "Carlos Mendoza",
    "autor_email": "carlos@serviciosintegrales.com",
    "autor_rol": "agente"
  }
]
```

> El cliente solo recibirá la primera nota del ejemplo anterior. La interna no aparece en su respuesta.

Las notas se retornan ordenadas por `creado_en ASC` (cronológicamente).

**Respuestas de error:**

| Código | Causa |
|--------|-------|
| `401` | Token no enviado |
| `403` | Sin acceso al ticket |
| `404` | Ticket no encontrado |
| `500` | Error interno del servidor |

---

### `GET /api/tickets/:id/historial`

Retorna la línea de tiempo completa de eventos del ticket, ordenada cronológicamente.

**Headers:**
```
Authorization: Bearer <token>
```

**Params:**
- `id` — UUID del ticket

**Respuesta exitosa `200`:**
```json
[
  {
    "id": "uuid",
    "accion": "creacion",
    "detalle": "Ticket creado",
    "creado_en": "2026-04-15T09:00:00.000Z",
    "realizado_por": "Juan Pérez",
    "rol": "cliente"
  },
  {
    "id": "uuid",
    "accion": "asignacion",
    "detalle": "Agente asignado automáticamente por menor carga",
    "creado_en": "2026-04-15T09:00:01.000Z",
    "realizado_por": "Juan Pérez",
    "rol": "cliente"
  },
  {
    "id": "uuid",
    "accion": "cambio_estado",
    "detalle": "Estado cambiado de \"abierto\" a \"en_progreso\"",
    "creado_en": "2026-04-15T10:00:00.000Z",
    "realizado_por": "Carlos Mendoza",
    "rol": "agente"
  },
  {
    "id": "uuid",
    "accion": "nota_agregada",
    "detalle": "Respuesta pública agregada",
    "creado_en": "2026-04-15T10:05:00.000Z",
    "realizado_por": "Carlos Mendoza",
    "rol": "agente"
  }
]
```

**Acciones registradas en el historial:**

| Acción | Cuándo aparece |
|--------|----------------|
| `creacion` | Al crear el ticket |
| `asignacion` | Al asignar o reasignar un agente |
| `cambio_estado` | Al cambiar estado o prioridad |
| `nota_agregada` | Al agregar una nota pública o interna |
| `cierre` | Reservado para uso futuro |

**Respuestas de error:**

| Código | Causa |
|--------|-------|
| `401` | Token no enviado |
| `403` | Sin acceso al ticket |
| `404` | Ticket no encontrado |
| `500` | Error interno del servidor |

---

## Flujo típico en el frontend

**Vista de un ticket (panel de agente):**
1. `GET /api/tickets/:id` → carga los datos del ticket
2. `GET /api/tickets/:id/notas` → carga el hilo de mensajes
3. `GET /api/tickets/:id/historial` → carga la línea de tiempo lateral
4. `POST /api/tickets/:id/notas` → al enviar una respuesta o nota interna

**Vista de un ticket (panel de cliente):**
1. `GET /api/tickets/:id` → carga los datos del ticket
2. `GET /api/tickets/:id/notas` → carga solo las respuestas públicas
3. `POST /api/tickets/:id/notas` → al enviar una respuesta (siempre pública)
