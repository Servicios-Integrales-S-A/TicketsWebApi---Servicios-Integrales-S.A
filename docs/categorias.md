# Documentación — Módulo de Categorías
**Sistema de Tickets — Servicios Integrales S.A.**

---

## Descripción General

El módulo de categorías gestiona la clasificación de los tickets. Cada ticket debe pertenecer
a una categoría que determina el área de atención responsable. Las categorías también son
utilizadas por las reglas de asignación automática.

---

## Archivos involucrados

| Archivo | Descripción |
|---------|-------------|
| `src/controllers/categorias.controller.js` | Lógica de cada endpoint |
| `src/routes/categorias.routes.js` | Definición de rutas y permisos |

---

## Permisos por endpoint

| Endpoint | Rol requerido |
|----------|--------------|
| `GET /` | Cualquier usuario autenticado |
| `GET /:id` | Cualquier usuario autenticado |
| `POST /` | Solo admin |
| `PUT /:id` | Solo admin |
| `PUT /:id/toggle-activo` | Solo admin |

> Todos los endpoints requieren el header `Authorization: Bearer <token>`.

---

## Comportamiento por rol en el listado

| Rol | Qué ve |
|-----|--------|
| `admin` | Todas las categorías (activas e inactivas), puede filtrar por `activo` |
| `agente` | Solo categorías activas |
| `cliente` | Solo categorías activas |

---

## Categorías predefinidas

| Nombre | Descripción |
|--------|-------------|
| `Soporte Tecnico` | Problemas técnicos y de sistema |
| `Ventas` | Consultas y reclamos sobre ventas |
| `Facturacion` | Problemas con facturas y cobros |
| `General` | Consultas generales |

---

## Endpoints

---

### `GET /api/categorias`

Lista las categorías con soporte de filtros, búsqueda y paginación.

**Headers:**
```
Authorization: Bearer <token>
```

**Query params (todos opcionales):**

| Param | Tipo | Default | Rol | Descripción |
|-------|------|---------|-----|-------------|
| `activo` | boolean | — | Solo admin | Filtrar por estado: `true` o `false` |
| `search` | string | — | Todos | Buscar por nombre o descripción |
| `page` | number | `1` | Todos | Página actual |
| `limit` | number | `10` | Todos | Registros por página |

**Ejemplos de uso:**
```
GET /api/categorias
GET /api/categorias?search=soporte
GET /api/categorias?activo=false              ← solo admin
GET /api/categorias?search=ventas&page=1&limit=5
```

**Respuesta exitosa `200`:**
```json
{
  "datos": [
    {
      "id": "uuid",
      "nombre": "Soporte Tecnico",
      "descripcion": "Problemas técnicos y de sistema",
      "activo": true,
      "creado_en": "2026-04-14T10:00:00.000Z"
    }
  ],
  "paginacion": {
    "total": 4,
    "pagina": 1,
    "limit": 10,
    "paginas": 1
  }
}
```

---

### `GET /api/categorias/:id`

Retorna los datos de una categoría específica.

**Params:**
- `id` — UUID de la categoría

**Respuesta exitosa `200`:**
```json
{
  "id": "uuid",
  "nombre": "Soporte Tecnico",
  "descripcion": "Problemas técnicos y de sistema",
  "activo": true,
  "creado_en": "2026-04-14T10:00:00.000Z",
  "actualizado_en": null
}
```

**Respuestas:**

| Status | Descripción |
|--------|-------------|
| `200` | Datos de la categoría |
| `404` | Categoría no encontrada |
| `500` | Error interno del servidor |

---

### `POST /api/categorias`

Crea una nueva categoría.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "nombre": "Recursos Humanos",
  "descripcion": "Consultas relacionadas al área de RRHH"
}
```

**Campos requeridos:** `nombre`
**Campos opcionales:** `descripcion`

**Respuestas:**

| Status | Descripción |
|--------|-------------|
| `201` | Categoría creada correctamente |
| `400` | Nombre requerido |
| `409` | Ya existe una categoría con ese nombre |
| `500` | Error interno del servidor |

**Notas:**
- El nombre de la categoría debe ser único en el sistema.

---

### `PUT /api/categorias/:id`

Actualiza los datos de una categoría.

**Params:**
- `id` — UUID de la categoría

**Body (todos opcionales, mínimo uno):**
```json
{
  "nombre": "Soporte Técnico",
  "descripcion": "Problemas técnicos, de sistema y conectividad"
}
```

**Respuestas:**

| Status | Descripción |
|--------|-------------|
| `200` | Categoría actualizada correctamente |
| `400` | No se envió ningún campo |
| `404` | Categoría no encontrada |
| `409` | Ya existe una categoría con ese nombre |
| `500` | Error interno del servidor |

**Notas:**
- Si se cambia el nombre, se valida que no exista otra categoría con ese mismo nombre.

---

### `PUT /api/categorias/:id/toggle-activo`

Habilita o deshabilita una categoría. Si está activa la desactiva, y viceversa.

**Params:**
- `id` — UUID de la categoría

**Sin body.** El estado se invierte automáticamente.

**Respuesta exitosa `200`:**
```json
{ "mensaje": "Categoría deshabilitada correctamente." }
// o
{ "mensaje": "Categoría habilitada correctamente." }
```

**Respuestas:**

| Status | Descripción |
|--------|-------------|
| `200` | Estado cambiado correctamente |
| `404` | Categoría no encontrada |
| `500` | Error interno del servidor |

**Notas:**
- Las categorías deshabilitadas no aparecen en el listado para clientes ni agentes.
- Los tickets existentes asociados a una categoría deshabilitada **no se ven afectados**.
- Las reglas de asignación asociadas a una categoría deshabilitada dejan de aplicarse al no aparecer en el selector de tickets.
- No se eliminan físicamente para preservar la integridad histórica de los tickets.

---

## Relación con otros módulos

| Módulo | Relación |
|--------|----------|
| `Tickets` | Cada ticket pertenece a una categoría (`id_categoria`) |
| `Reglas de Asignación` | Las reglas pueden configurarse por categoría para asignación automática |

---

## Flujo típico de uso

```
1. Admin crea/gestiona categorías
2. Cliente crea un ticket → selecciona una categoría activa
3. Sistema busca regla de asignación para esa categoría + prioridad
4. Si existe regla → asigna agente automáticamente
```
