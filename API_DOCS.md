# 📚 API Contract Final - GanaderoApp

Base URL: `http://localhost:3001/api`

## 1) Inventario frontend (`index.html`) vs backend (`server.js`)

| Endpoint consumido por frontend | Método | Estado |
|---|---|---|
| `/auth/login` | POST | ✅ Soportado |
| `/animales` | GET | ✅ Soportado |
| `/dashboard` | GET | ✅ Soportado |
| `/tratamientos/pendientes` | GET | ✅ Soportado |
| `/tratamientos` | GET | ✅ Soportado |
| `/busquedas-recientes` | GET | ✅ Soportado |
| `/lotes` | GET | ✅ Soportado |
| `/animales/:id` | GET | ✅ Soportado |
| `/animales/:id` | PUT | ✅ Soportado |
| `/pesajes` | POST | ✅ Soportado |
| `/tratamientos` | POST | ✅ Soportado |
| `/lotes/:id` | GET | ✅ Soportado |
| `/animales/caravana/:caravana` | GET | ✅ Soportado |
| `/animales` | POST | ✅ Soportado |
| `/lotes` | POST | ✅ Soportado |

## 2) Estrategia aplicada

Se implementó en backend la estrategia **“agregar rutas faltantes”** para alinear API y frontend, evitando eliminar funcionalidades de UI.

Rutas incorporadas/normalizadas:
- `GET /api/tratamientos`
- `GET /api/animales/:id`
- `GET /api/busquedas-recientes`
- `GET /api/lotes`
- `GET /api/lotes/:id`

Además, para sostener el contrato:
- `POST /api/lotes`
- Persistencia de búsquedas recientes.
- Soporte de `foto_url` y `lote_id` en `PUT /api/animales/:id`.

---

## 3) Endpoints

> Todas las rutas, salvo autenticación, requieren:
>
> `Authorization: Bearer {token}`

### Auth
- `POST /auth/login`
- `POST /auth/registro`

### Animales
- `GET /animales`
- `GET /animales/:id`
- `GET /animales/caravana/:caravana`
- `POST /animales`
- `PUT /animales/:id`

### Pesajes
- `POST /pesajes`

### Tratamientos
- `GET /tratamientos`
- `GET /tratamientos/pendientes`
- `POST /tratamientos`

### Lotes
- `GET /lotes`
- `GET /lotes/:id`
- `POST /lotes`

### Búsquedas
- `GET /busquedas-recientes`

### Dashboard
- `GET /dashboard`

---


## ✅ Reglas de validación efectivas

### POST /auth/login
- `email` es obligatorio.
- `password` es obligatorio.
- Si falta alguno, responde **400**.

### POST /auth/registro
- `email`, `password` y `nombre_campo` son obligatorios.
- `password` debe tener al menos 6 caracteres.
- Si no cumple, responde **400**.

### POST /animales
- `caravana` es obligatoria.
- `sexo` (si se envía) debe ser `hembra` o `macho`.
- Si no cumple, responde **400**.

### POST /pesajes
- `animal_id` y `peso` son obligatorios.
- `peso` debe ser mayor a 0.
- Si no cumple, responde **400**.

### POST /tratamientos
- `animal_id`, `tipo` y `descripcion` son obligatorios.
- `tipo` debe ser uno de: `vacuna`, `desparasitacion`, `antibiotico`, `vitamina`, `otro`.
- Si no cumple, responde **400**.

---

## ❌ Códigos de Error

Cuando una petición falla, backend responde:

```json
{
  "error": "Mensaje descriptivo"
}
```

Códigos esperados:
- `400` datos inválidos
- `401` no autorizado/token inválido
- `404` recurso inexistente
- `500` error interno

---

## 5) Comportamiento esperado en frontend

El frontend debe:
- Considerar error de integración toda respuesta `!response.ok`.
- Mostrar mensaje explícito al usuario (`Error de integración API: ...`).
- Evitar actualizar estado de éxito cuando la API responde con error.

Este comportamiento ya se aplica en carga principal de dashboard, detalle de animal, detalle de lote, alta de pesaje, alta de tratamiento y edición de foto.
