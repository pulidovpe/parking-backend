# Parking Backend 🚗🅿️

Backend robusto para gestión de estacionamientos, construido con tecnologías modernas y **estándares de seguridad empresarial**.

## 🛠️ Stack Tecnológico

- **Core:** [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Fastify](https://www.fastify.io/)
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) (Datos), [PostGIS](https://postgis.net/) (Geo), [Redis](https://redis.io/) (Cache/Colas).
- **ORM:** [Prisma](https://www.prisma.io/).
- **Seguridad:** [JWT](https://jwt.io/), [Bcrypt](https://github.com/dcodeIO/bcrypt.js), [Speakeasy](https://github.com/speakeasyjs/speakeasy) (2FA), AES-256.
- **Utilidades:** [Nodemailer](https://nodemailer.com/), [Zod](https://zod.dev/), [Node-Cron](https://github.com/node-cron/node-cron).

## 🛡️ Características de Seguridad

Este backend implementa medidas de protección avanzadas:
* ✅ **2FA (Doble Factor):** Soporte para Google Authenticator / Authy.
* ✅ **Rate Limiting:** Protección global contra fuerza bruta y DDoS.
* ✅ **Auditoría (Audit Logs):** Registro inmutable de quién hizo qué y cuándo.
* ✅ **Encriptación en Reposo:** Los secretos sensibles se cifran con AES-256 en la BD.
* ✅ **Gestión de Sesiones:** Access Tokens (15 min) + Refresh Tokens (7 días) con rotación.
* ✅ **Protección de Cuenta:** Bloqueo automático tras 3 intentos fallidos de login.

## 🚀 Funcionalidades de Negocio
- **Gestión Geográfica:** Búsqueda de parkings por cercanía (GPS).
- **Reservas Inteligentes:** Validación de disponibilidad en tiempo real y cron jobs para auto-cancelación.
- **Pagos y Monedas:** Soporte multimoneda (USD/VES) con tasa de cambio dinámica.
- **Fidelización (Loyalty):** Sistema de gamificación con niveles (Bronce/Plata/Oro) y puntos canjeables.
- **Analytics:** Dashboard administrativo con métricas financieras y operativas.

## 🔌 Endpoints Principales

Todos los endpoints (excepto Auth público) requieren el header: `Authorization: Bearer <access_token>`.

### 🔐 Autenticación y Seguridad
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

### 🚗 Core (Parkings y Reservas)
| Método | Endpoint | Descripción | Campos Requeridos (Body/Query) | Datos Devueltos |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/parkings/nearby` | Buscar por cercanía. | **Query:** `latitude`, `longitude`, `radius` (km, opcional) | `[ { id, name, distance, ... } ]` |
| `GET` | `/api/spaces/parking/:id` | Ver mapa de espacios. | **Params:** `id` (parkingId) | `{ levels: [ { name, spaces: [] } ] }` |
| `POST` | `/api/reservations` | Crear reserva. | **Body:** `parkingId`, `spaceId`, `startTime`, `estimatedEndTime` | `{ id, status: "PENDING", totalCost, ... }` |
| `PATCH` | `/api/reservations/:id/activate` | Check-in (Entrada). | **Params:** `id` (reservationId) | `{ id, status: "ACTIVE", actualStartTime }` |
| `GET` | `/api/reservations/my-history` | Historial usuario. | **Header:** `Authorization` | `[ { id, parkingName, status, cost } ]` |

### 💸 Finanzas (Pagos y Puntos)
| Método | Endpoint | Descripción | Campos Requeridos (Body/Query) | Datos Devueltos |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/report` | Reportar pago. | **Body:** `reservationId`, `amount`, `currency` (USD/VES), `referenceId`, `method` | `{ id, status: "PENDING", amountInUsd }` |
| `PUT` | `/api/payments/:id/verify` | Validar pago (Manager). | **Params:** `id` (transactionId) | `{ id, status: "VERIFIED", verifiedBy }` |
| `GET` | `/api/loyalty/me` | Ver perfil de lealtad. | **Header:** `Authorization` | `{ pointsBalance, tier, lifetimePoints }` |

### 📊 Analytics (Solo Managers)
| Método | Endpoint | Descripción | Campos Requeridos (Body/Query) | Datos Devueltos |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/dashboard` | KPIs del negocio. | **Header:** `Authorization` | `{ revenue: { daily, monthly }, occupancyRate, topUsers }` |
| `GET` | `/api/analytics/export` | Exportar datos. | **Query:** `format=csv` | Archivo descargable `.csv` |

## 🛠️ Instalación y Despliegue

1. **Variables de Entorno:** Renombrar `.env.example` a `.env` y configurar:
   - `DATABASE_URL` (Postgres)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `ENCRYPTION_KEY` (Generar con `openssl rand -hex 32`)
   - Credenciales SMTP (Ethereal/Gmail/AWS)

2. **Docker:** `npm run docker:up`
3. **Base de Datos:** `npm run prisma:migrate`
4. **Desarrollo:** `npm run dev`

## 🗺️ Roadmap
Puedes consultar el plan detallado de desarrollo y las fases futuras en el [Roadmap de Desarrollo](plans/roadmap.md).
---
*Backend v1.0 - Fase de Seguridad Completada*