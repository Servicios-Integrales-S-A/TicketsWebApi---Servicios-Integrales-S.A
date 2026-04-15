# Documentación — Módulo de Tickets
**Sistema de Tickets — Servicios Integrales S.A.**

---

## Descripción General

El módulo de tickets gestiona la creación de tickets de soporte desde múltiples canales.
La asignación de agentes es automática (por menor carga activa) o manual según el rol y lo que se envíe.

---

## Archivos involucrados

| Archivo | Descripción |
|---------|-------------|
| `src/controllers/tickets.controller.js` | Lógica de creación de tickets |
| `src/controllers/reglas.controller.js` | Función `obtenerAgentePorMenorCarga` |
| `src/routes/tickets.routes.js` | Definición de rutas |
| `src/middlewares/auth.middleware.js` | Verificación de token JWT |

---

## Valores válidos

### Canales

| Valor | Usado por |
|-------|-----------|
| `web` | Cliente (formulario web) |
| `chat` | Cliente (componente de chat) |
| `telefono` | Agente / Admin |
| `presencial` | Agente / Admin |
| `email` | Sistema — listener IMAP (no viene del frontend) |
| `forms` | Sistema — Google Forms (no viene del frontend) |

### Prioridades

| Valor | Descripción |
|-------|-------------|
| `critico` | Urgencia máxima |
| `alto` | Alta urgencia |
| `medio` | Urgencia media |
| `bajo` | Baja urgencia |

---

## Endpoints

---

### `POST /api/tickets`

Crea un nuevo ticket. Requiere token JWT válido (cualquier rol).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Campos del body

| Campo | Tipo | cliente | agente / admin | Descripción |
|-------|------|---------|----------------|-------------|
| `titulo` | string | Requerido | Requerido | Título corto del ticket |
| `descripcion` | string | Requerido | Requerido | Descripción detallada del problema |
| `id_categoria` | UUID | Requerido | Requerido | ID de la categoría activa |
| `canal` | string | Requerido | Requerido | Origen del ticket (ver detalle abajo) |
| `id_cliente` | UUID | Ignorado | Obligatorio | ID del cliente al que pertenece el ticket |
| `prioridad` | string | Ignorado | Opcional | Si no se envía, se usa el default de la categoría |
| `id_agente` | UUID | Ignorado | Opcional | Si no se envía, se asigna por menor carga automáticamente |

---

### Detalle de cada campo

#### `canal`

**Para clientes:**
- Solo puede ser `web` o `chat`. Cualquier otro valor devuelve **403**.
- El usuario no lo escribe. El frontend lo determina según el componente que origina el ticket:
  - Formulario de soporte web → envía `"canal": "web"`
  - Componente de chat → envía `"canal": "chat"`

**Para agentes y admins:**
- Pueden usar `web`, `chat`, `telefono` o `presencial`.
- Representa cómo se está atendiendo al cliente en ese momento.
- El frontend puede mostrar un selector o establecer un valor por defecto según el contexto del panel. Es decisión del frontend cómo presentarlo.
- `email` y `forms` están reservados para el sistema y no deben enviarse desde el panel.

---

#### `id_cliente`

**Para clientes:**
- No debe enviarse. La API siempre usa el id del token del cliente autenticado.

**Para agentes y admins:**
- Es **obligatorio**. Indica a qué cliente pertenece el ticket que se está registrando.
- Si no se envía → **400**.

**Flujo recomendado en el frontend (panel de agente/admin):**

El campo `id_cliente` debe resolverse mediante un buscador de clientes antes de enviar el formulario del ticket. El flujo es el siguiente:

**1. Buscador de clientes**
- Mostrar un campo de búsqueda (por nombre, apellido o email) que consulte `GET /api/usuarios?rol=cliente&buscar=<texto>`.
- Mientras el agente escribe, se listan los clientes que coincidan.
- Al seleccionar un cliente de la lista, su UUID queda guardado como `id_cliente` y se muestra su nombre en el campo.

**2. Opción "Agregar nuevo cliente"**
- Al final de los resultados del buscador (o si la búsqueda no retorna resultados), mostrar una opción: **"+ Agregar nuevo cliente"**.
- Al seleccionarla, abrir un formulario o modal con los campos: `nombre`, `apellido`, `email`, `telefono` (opcional).
- Ese formulario llama a `POST /api/usuarios` con rol `cliente` y el token del agente/admin.
- Si la creación es exitosa, la API retorna el `id` del nuevo usuario.
- Automáticamente se cierra el modal/formulario, el nuevo cliente queda seleccionado en el buscador y su `id` se usa como `id_cliente` en el ticket, sin que el agente tenga que buscarlo manualmente.

**Endpoints involucrados en este flujo:**

| Acción | Endpoint | Descripción |
|--------|----------|-------------|
| Buscar cliente existente | `GET /api/usuarios?rol=cliente&buscar=<texto>` | Lista clientes activos que coincidan con el texto |
| Crear nuevo cliente | `POST /api/usuarios` | Crea el usuario con rol cliente. Ver docs/usuarios.md |

**Nota:** El agente solo necesita saber el `id` del cliente al momento de enviar el formulario del ticket. Cómo se obtenga ese `id` (búsqueda o creación) es transparente para la API.

---

#### `prioridad`

**Para clientes:**
- No debe enviarse. La API siempre usa la `prioridad_default` configurada en la categoría seleccionada.

**Para agentes y admins:**
- Es **opcional**.
- Si **no se envía** → se usa automáticamente la `prioridad_default` de la categoría.
- Si **se envía** → sobreescribe el default. Valores válidos: `critico`, `alto`, `medio`, `bajo`.
- El frontend puede mostrar la prioridad default como sugerencia y permitir modificarla.

---

#### `id_agente`

**Para clientes:**
- No debe enviarse. La API siempre asigna automáticamente por menor carga.

**Para agentes y admins:**
- Es **opcional**.
- Si **no se envía** → la API ejecuta la lógica de asignación automática por menor carga.
- Si **se envía** → se asigna directamente ese agente sin pasar por la lógica automática. Debe ser el UUID de un agente activo.
- Si la asignación automática no encuentra un agente disponible, el ticket queda sin asignar y debe gestionarse manualmente después.

---

### Ejemplos de body por escenario

**Cliente creando ticket desde el formulario web:**
```json
{
  "titulo": "Mi impresora no funciona",
  "descripcion": "La impresora no enciende desde esta mañana.",
  "id_categoria": "uuid-de-la-categoria",
  "canal": "web"
}
```
> El frontend envía `canal: "web"` automáticamente. No se envía `id_cliente`, `prioridad` ni `id_agente`.

---

**Agente registrando ticket con asignación automática:**
```json
{
  "titulo": "Error al generar factura",
  "descripcion": "El cliente no puede generar facturas desde ayer.",
  "id_categoria": "uuid-de-la-categoria",
  "canal": "telefono",
  "id_cliente": "uuid-del-cliente"
}
```
> No se envía `prioridad` ni `id_agente` → se usan los valores automáticos. El canal puede ser `telefono` o `presencial` según corresponda.

---

**Admin registrando ticket con prioridad y agente específicos:**
```json
{
  "titulo": "Servidor caído en sucursal norte",
  "descripcion": "El servidor de la sucursal norte no responde desde las 8am.",
  "id_categoria": "uuid-de-la-categoria",
  "canal": "presencial",
  "id_cliente": "uuid-del-cliente",
  "prioridad": "critico",
  "id_agente": "uuid-del-agente"
}
```
> Se sobreescribe tanto la prioridad como el agente asignado.

---

### Respuesta exitosa `201`

```json
{
  "mensaje": "Ticket creado correctamente.",
  "id": "uuid-del-ticket",
  "numero_legible": "TKT-00001",
  "prioridad": "critico",
  "asignado_automaticamente": true,
  "agente_asignado": true
}
```

| Campo | Descripción |
|-------|-------------|
| `id` | UUID del ticket creado |
| `numero_legible` | Número secuencial legible (TKT-00001) |
| `prioridad` | Prioridad final aplicada (default o la enviada manualmente) |
| `asignado_automaticamente` | `true` si fue por menor carga, `false` si fue manual o sin asignar |
| `agente_asignado` | `true` si quedó con agente, `false` si quedó sin asignar |

---

### Respuestas de error

| Código | Causa |
|--------|-------|
| `400` | Falta `titulo`, `descripcion`, `id_categoria` o `canal` |
| `400` | Canal no válido |
| `400` | Prioridad enviada no válida |
| `400` | La categoría no existe o está deshabilitada |
| `400` | Agente/admin no envió `id_cliente` |
| `400` | `id_cliente` no existe o no tiene rol `cliente` |
| `400` | `id_agente` no existe o no tiene rol `agente` |
| `401` | No se envió el token JWT |
| `403` | Token inválido o expirado |
| `403` | Cliente intentó usar canal no permitido |
| `500` | Error interno del servidor |

---

## Historial automático

Cada creación de ticket genera entradas automáticas en `Historial_Tickets`:

| Acción registrada | Cuándo |
|-------------------|--------|
| `creacion` | Siempre al crear el ticket |
| `asignacion` | Solo si se asignó un agente. El detalle indica si fue manual o automática |

---

## Lógica de asignación automática (menor carga)

Cuando no se envía `id_agente`, la API:

1. Busca reglas de asignación **activas** que coincidan con la `id_categoria` y `prioridad` del ticket.
2. Obtiene los agentes asociados a esas reglas.
3. Cuenta cuántos tickets tiene cada agente en estado `abierto` o `en_progreso`.
4. Asigna el agente con el menor número de tickets activos.
5. Si hay empate, se toma el primero encontrado.
6. Si no hay reglas aplicables o no hay agentes disponibles → el ticket queda sin agente asignado.
