# Documentación — Módulo de Integraciones
**Sistema de Tickets — Servicios Integrales S.A.**

---

## Descripción General

El módulo de integraciones expone endpoints protegidos por API Key (no por JWT) para recibir tickets desde sistemas externos como Google Forms o un listener de correo electrónico.

---

## Archivos involucrados

| Archivo | Descripción |
|---------|-------------|
| `src/controllers/integraciones.controller.js` | Lógica de cada integración |
| `src/routes/integraciones.routes.js` | Definición de rutas |
| `src/middlewares/apiKey.middleware.js` | Verificación de API Key |

---

## Autenticación

Estos endpoints **no usan JWT**. En su lugar requieren una API Key en el header:

```
x-api-key: <valor-de-INTEGRATION_API_KEY>
```

La clave está definida en el archivo `.env`:
```
INTEGRATION_API_KEY=forms_secret_key_2024
```

Si no se envía el header → **401**. Si la clave es incorrecta → **403**.

---

## Endpoints

---

### `POST /api/integraciones/forms`

Crea un ticket a partir de una respuesta de Google Forms.

**Headers:**
```
x-api-key: forms_secret_key_2024
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Mi impresora no funciona",
  "descripcion": "La impresora no enciende desde esta mañana.",
  "nombre_categoria": "Soporte Tecnico",
  "email": "cliente@ejemplo.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "55551234"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `titulo` | string | Sí | Título del problema |
| `descripcion` | string | Sí | Descripción detallada |
| `nombre_categoria` | string | Sí | Nombre exacto de la categoría (debe existir y estar activa) |
| `email` | string | Sí | Correo del cliente. Si no existe en el sistema se crea automáticamente |
| `nombre` | string | Sí | Nombre del cliente |
| `apellido` | string | Sí | Apellido del cliente |
| `telefono` | string | No | Teléfono del cliente |

**Comportamiento:**

- Si el email **ya existe** en el sistema → se usa ese usuario como cliente.
- Si el email **no existe** → se crea el usuario automáticamente con rol `cliente`. La contraseña temporal es el email hasheado con bcrypt. El cliente debe cambiarla al iniciar sesión por primera vez.
- La prioridad se toma de `prioridad_default` de la categoría.
- El agente se asigna automáticamente por menor carga.
- El ticket se registra con `canal = 'forms'`.

**Respuesta exitosa `201`:**
```json
{
  "mensaje": "Ticket creado correctamente desde Google Forms.",
  "numero_legible": "TKT-00003",
  "prioridad": "critico",
  "agente_asignado": true
}
```

**Respuestas de error:**

| Código | Causa |
|--------|-------|
| `400` | Faltan campos requeridos |
| `400` | La categoría no existe o está deshabilitada |
| `401` | No se envió el header `x-api-key` |
| `403` | La API Key es incorrecta |
| `500` | Error interno del servidor |

---

## Configuración de Google Forms

### Paso 1 — Crear el formulario

Crear un formulario en [Google Forms](https://forms.google.com) con los siguientes campos (los títulos deben coincidir exactamente):

| Título del campo | Tipo | Obligatorio |
|-----------------|------|-------------|
| Título del problema | Respuesta corta | Sí |
| Descripción del problema | Párrafo | Sí |
| Categoría | Desplegable | Sí |
| Correo electrónico | Respuesta corta (validación: email) | Sí |
| Nombre | Respuesta corta | Sí |
| Apellido | Respuesta corta | Sí |
| Teléfono | Respuesta corta | No |

> Las opciones del campo **Categoría** deben coincidir exactamente con los nombres en la base de datos (ej: `Soporte Tecnico`, `Facturacion`, `Ventas`, `General`).

### Paso 2 — Configurar Apps Script

1. Abrir el formulario → **Extensiones → Apps Script**
2. Reemplazar todo el contenido con el siguiente script:

```javascript
function onFormSubmit(e) {
  const API_URL = 'https://TU-URL-PUBLICA/api/integraciones/forms';
  const API_KEY = 'forms_secret_key_2024';

  const itemResponses = e.response.getItemResponses();

  const data = {};
  itemResponses.forEach(item => {
    const clave = item.getItem().getTitle().trim();
    data[clave] = item.getResponse();
  });

  const payload = {
    titulo:           data['Título del problema'] || '',
    descripcion:      data['Descripción del problema'] || '',
    nombre_categoria: data['Categoría'] || '',
    email:            data['Correo electrónico'] || '',
    nombre:           data['Nombre'] || '',
    apellido:         data['Apellido'] || '',
    telefono:         data['Teléfono'] || ''
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': API_KEY,
      'ngrok-skip-browser-warning': 'true'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(API_URL, options);
  Logger.log('Status: ' + response.getResponseCode());
  Logger.log('Respuesta: ' + response.getContentText());
}
```

3. Guardar el script (Ctrl+S)

### Paso 3 — Configurar el Trigger

1. En Apps Script → panel izquierdo → ícono de **Triggers** (reloj)
2. Clic en **"+ Agregar activador"**
3. Configurar:

| Campo | Valor |
|-------|-------|
| Función a ejecutar | `onFormSubmit` |
| Fuente del evento | Desde el formulario |
| Tipo de evento | Al enviar el formulario |
| Notificaciones de falla | Una vez por día |

4. Guardar → aceptar los permisos de Google

### Paso 4 — Publicar el formulario

1. En Google Forms → botón **"Enviar"** (arriba a la derecha)
2. Copiar el enlace generado
3. Compartir ese enlace con los usuarios o incrustarlo en la web

---

## Conectar la API con ngrok (entorno de desarrollo)

ngrok permite exponer el servidor local con una URL pública temporal, necesaria para que Google Apps Script pueda comunicarse con la API durante el desarrollo.

### Instalación

1. Crear cuenta gratuita en [https://ngrok.com](https://ngrok.com)
2. Descargar el ejecutable para Windows
3. Autenticar ngrok con el authtoken de la cuenta:
```bash
ngrok config add-authtoken TU_AUTHTOKEN
```

### Uso

1. Asegurarse de que la API esté corriendo (`npm run dev` o `node src/index.js`)
2. En otra terminal, ejecutar:
```bash
ngrok http 3000
```
3. ngrok mostrará una URL pública similar a:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```
4. Copiar esa URL y reemplazarla en el campo `API_URL` del Apps Script:
```javascript
const API_URL = 'https://abc123.ngrok-free.app/api/integraciones/forms';
```
5. Guardar el script. A partir de ese momento, al enviar el formulario el request llegará a la API local.

### Consideraciones importantes

| Aspecto | Detalle |
|---------|---------|
| La URL cambia | Cada vez que se reinicia ngrok se genera una URL diferente. Hay que actualizar el Apps Script. |
| La sesión expira | En la versión gratuita, la sesión de ngrok expira después de varias horas. |
| Header requerido | ngrok muestra una advertencia HTML al acceder desde scripts externos. Se evita agregando el header `ngrok-skip-browser-warning: true` en la petición (ya incluido en el script). |
| Producción | Para entornos de producción se debe desplegar la API en un servidor con URL fija (Railway, Render, VPS, etc.) y actualizar `API_URL` con esa URL permanente. |

### Verificar que funciona

Después de enviar una respuesta de prueba al formulario:

1. En Apps Script → **Ejecuciones** → abrir la última ejecución de `onFormSubmit`
2. Verificar que los logs muestren `Status: 201`
3. Verificar en la base de datos que el ticket fue creado en la tabla `Tickets`
