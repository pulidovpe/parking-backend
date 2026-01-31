# Documentación de Endpoints API - Parking Backend

A continuación se listan todas las rutas disponibles en la API, organizadas por módulo.

**Base URL:** `/api`

## 🔐 Autenticación (`/auth`)
Gestión de usuarios y seguridad.

| Método | Ruta | Descripción | Auth Requerida | Roles Permitidos |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/register` | Registrar un nuevo usuario (Conductor o Manager). | ❌ | - |
| `POST` | `/login` | Iniciar sesión y obtener Tokens (Access + Refresh). | ❌ | - |
| `POST` | `/verify-email` | Verificar correo electrónico con token enviado. | ❌ | - |
| `POST` | `/request-reset-password` | Solicitar correo de recuperación de contraseña. | ❌ | - |
| `POST` | `/reset-password` | Establecer nueva contraseña usando el token de reset. | ❌ | - |
| `POST` | `/refresh` | Obtener un nuevo Access Token usando un Refresh Token válido. | ❌ | - |
| `POST` | `/logout` | Cerrar sesión (invalida el Refresh Token actual). | ✅ | Todos |
| `POST` | `/2fa/setup` | Iniciar configuración de 2FA (Genera secreto y QR). | ✅ | Todos |
| `POST` | `/2fa/verify` | Verificar código TOTP para activar 2FA en la cuenta. | ✅ | Todos |
| `POST` | `/2fa/disable` | Desactivar la autenticación de dos factores. | ✅ | Todos |

## 🅿️ Estacionamientos (`/parkings`)
Gestión de sedes y locaciones.

| Método | Ruta | Descripción | Auth Requerida | Roles Permitidos |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/` | **Crear un nuevo estacionamiento.** | ✅ | Manager, Admin |
| `GET` | `/` | Listar todos los estacionamientos (soporta filtros). | ❌ | - |
| `GET` | `/nearby` | Buscar estacionamientos cercanos por latitud/longitud. | ❌ | - |
| `GET` | `/:id` | Obtener detalles de un estacionamiento específico. | ❌ | - |
| `PUT` | `/:id` | Actualizar datos de un estacionamiento. | ✅ | Manager (Dueño), Admin |
| `DELETE` | `/:id` | Eliminar (o desactivar) un estacionamiento. | ✅ | Manager (Dueño), Admin |

## 🚗 Espacios (`/spaces`)
Gestión de plazas individuales dentro de un estacionamiento.

| Método | Ruta | Descripción | Auth Requerida | Roles Permitidos |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/` | Crear un nuevo espacio (slot) en un parking. | ✅ | Manager, Admin |
| `GET` | `/:parkingId` | Listar todos los espacios de un estacionamiento. | ❌ | - |
| `PUT` | `/:id` | Actualizar un espacio (ej: cambiar tipo, estado). | ✅ | Manager, Admin |
| `DELETE` | `/:id` | Eliminar un espacio. | ✅ | Manager, Admin |

## 📅 Reservas (`/reservations`)
Flujo principal de reserva de espacios.

| Método | Ruta | Descripción | Auth Requerida | Roles Permitidos |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/` | Crear una nueva reserva. | ✅ | Driver |
| `GET` | `/my-history` | Obtener historial de reservas del usuario logueado. | ✅ | Driver |
| `POST` | `/:id/cancel` | Cancelar una reserva activa. | ✅ | Driver (Dueño), Manager |
| `GET` | `/:id/qrcode` | Obtener el código QR de acceso para una reserva. | ✅ | Driver (Dueño) |

## 💰 Pagos (`/payments`)
Gestión de transacciones financieras.

| Método | Ruta | Descripción | Auth Requerida | Roles Permitidos |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/transaction` | Reportar un pago (Pago Móvil, Transferencia, Puntos). | ✅ | Driver |
| `POST` | `/verify` | Verificar/Aprobar una transacción pendiente. | ✅ | Manager, Admin |
| `GET` | `/history` | Ver historial de pagos realizados por el usuario. | ✅ | Driver |
| `GET` | `/pending` | Listar pagos pendientes de verificación (Dashboard). | ✅ | Manager, Admin |
| `GET` | `/reservation/:id` | Ver transacciones asociadas a una reserva específica. | ✅ | Driver, Manager |

## 💎 Fidelidad (`/loyalty`)
Sistema de puntos y recompensas.

| Método | Ruta | Descripción | Auth Requerida | Roles Permitidos |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/profile` | Ver perfil de fidelidad (Balance de puntos, Nivel). | ✅ | Driver |
| `GET` | `/history` | Ver historial de puntos ganados y gastados. | ✅ | Driver |
| `POST` | `/convert` | Convertir puntos (ej: canjear por saldo). | ✅ | Driver |

## 📊 Analíticas (`/analytics`)
Reportes y estadísticas para gestión.

| Método | Ruta | Descripción | Auth Requerida | Roles Permitidos |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/manager/dashboard` | KPIs generales (Reservas hoy, Ingresos hoy, Ocupación). | ✅ | Manager |
| `GET` | `/manager/revenue` | Reporte detallado de ingresos y métodos de pago. | ✅ | Manager |
| `GET` | `/manager/occupancy/:parkingId` | Estadísticas de ocupación por horas/días. | ✅ | Manager |
| `GET` | `/admin/system-health` | Estado de salud del sistema y métricas técnicas. | ✅ | Admin |
