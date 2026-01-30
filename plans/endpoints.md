# Documentación de Endpoints - Parking Backend

Esta es la lista detallada de los endpoints disponibles en la API. Todos los endpoints (excepto Auth público) requieren el header: `Authorization: Bearer <access_token>`.

## 🔐 Autenticación y Seguridad

| Método | Endpoint | Descripción | Campos Requeridos (Body/Query) | Datos Devueltos |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registro de usuario. | **Body:** `email`, `password`, `firstName`, `lastName`, `phone`, `role` | `{ success: true, message: "..." }` (Sin tokens, requiere verificar email) |
| `POST` | `/api/auth/login` | Inicio de sesión. | **Body:** `email`, `password`, `twoFactorCode` (opcional si tiene 2FA) | `{ user, accessToken, refreshToken }` |
| `POST` | `/api/auth/refresh` | Renovar sesión vencida. | **Body:** `refreshToken` | `{ accessToken, refreshToken }` (Nuevos) |
| `GET` | `/api/auth/verify` | Validar email. | **Query:** `token` (del correo) | `{ success: true, message: "..." }` |
| `POST` | `/api/auth/forgot-password` | Pedir recuperación. | **Body:** `email` | `{ message: "Si existe, enviamos correo..." }` |
| `POST` | `/api/auth/reset-password` | Cambiar clave. | **Body:** `token` (8 chars), `newPassword` | `{ success: true, message: "..." }` |
| `POST` | `/api/auth/2fa/setup` | Iniciar configuración 2FA. | **Header:** `Authorization` <br> **Body:** `{}` | `{ secret, qrCodeUrl }` |
| `POST` | `/api/auth/2fa/enable` | Activar 2FA. | **Body:** `token` (Código de 6 dígitos) | `{ success: true, message: "2FA activado" }` |

## 🚗 Core (Parkings y Reservas)

| Método | Endpoint | Descripción | Campos Requeridos (Body/Query) | Datos Devueltos |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/parkings/nearby` | Buscar por cercanía. | **Query:** `latitude`, `longitude`, `radius` (km, opcional) | `[ { id, name, distance, ... } ]` |
| `GET` | `/api/spaces/parking/:id` | Ver mapa de espacios. | **Params:** `id` (parkingId) | `{ levels: [ { name, spaces: [] } ] }` |
| `POST` | `/api/reservations` | Crear reserva. | **Body:** `parkingId`, `spaceId`, `startTime`, `estimatedEndTime` | `{ id, status: "PENDING", totalCost, ... }` |
| `PATCH` | `/api/reservations/:id/activate` | Check-in (Entrada). | **Params:** `id` (reservationId) | `{ id, status: "ACTIVE", actualStartTime }` |
| `GET` | `/api/reservations/my-history` | Historial usuario. | **Header:** `Authorization` | `[ { id, parkingName, status, cost } ]` |

## 💸 Finanzas (Pagos y Puntos)

| Método | Endpoint | Descripción | Campos Requeridos (Body/Query) | Datos Devueltos |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/report` | Reportar pago. | **Body:** `reservationId`, `amount`, `currency` (USD/VES), `referenceId`, `method` | `{ id, status: "PENDING", amountInUsd }` |
| `PUT` | `/api/payments/:id/verify` | Validar pago (Manager). | **Params:** `id` (transactionId) | `{ id, status: "VERIFIED", verifiedBy }` |
| `GET` | `/api/loyalty/me` | Ver perfil de lealtad. | **Header:** `Authorization` | `{ pointsBalance, tier, lifetimePoints }` |

## 📊 Analytics (Solo Managers)

| Método | Endpoint | Descripción | Campos Requeridos (Body/Query) | Datos Devueltos |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/dashboard` | KPIs del negocio. | **Header:** `Authorization` | `{ revenue: { daily, monthly }, occupancyRate, topUsers }` |
| `GET` | `/api/analytics/export` | Exportar datos. | **Query:** `format=csv` | Archivo descargable `.csv` |
