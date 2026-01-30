# Parking Backend 🚗🅿️

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-black.svg)](https://www.fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-black.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)

Backend robusto y escalable para la gestión integral de estacionamientos, diseñado bajo una arquitectura orientada a servicios y **estándares de seguridad empresarial**.

---

## 🌟 Características Principales

### 🔐 Seguridad de Nivel Bancario
*   **MFA/2FA:** Autenticación de doble factor vía TOTP (Google Authenticator / Authy).
*   **Gestión de Sesiones:** Sistema de Access Tokens (15 min) & Refresh Tokens (7 días) con rotación automática.
*   **Protección Dinámica:** Rate limiting global contra fuerza bruta y bloqueo automático de cuentas tras 3 intentos fallidos.
*   **Auditoría:** Registro inmutable de acciones críticas (Audit Logs) en la base de datos.
*   **Cifrado:** Secretos sensibles y datos privados protegidos con AES-256 en reposo.
*   **Verificación:** Validación obligatoria de email para activación de cuenta.

### 🚗 Core de Negocio
*   **Geolocalización:** Búsqueda avanzada de estacionamientos cercanos mediante PostGIS (GPS).
*   **Reservas Inteligentes:** Control de disponibilidad en tiempo real y validación de rangos horários.
*   **Mapa de Espacios:** Visualización jerárquica por niveles y tipos de plaza.
*   **Automatización:** Cron jobs para la limpieza de reservas pendientes no activadas y liberación automática de espacios.

### 💰 Finanzas y Lealtad
*   **Pagos Multimoneda:** Soporte para USD y VES con reporte de pago móvil y conversión dinámica.
*   **Sistema de Puntos (Loyalty):** Gamificación con niveles (Bronce, Plata, Oro) y acumulación automática de puntos canjeables.
*   **Analytics:** Dashboard administrativo con KPIs financieros, tasa de ocupación y exportación de datos en CSV.

---

## 🛠️ Stack Tecnológico

*   **Core:** [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Fastify](https://www.fastify.io/)
*   **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) (Datos), [PostGIS](https://postgis.net/) (Geo), [Redis](https://redis.io/) (Cache/Colas).
*   **ORM:** [Prisma](https://www.prisma.io/).
*   **Seguridad:** [JWT](https://jwt.io/), [Bcrypt](https://github.com/dcodeIO/bcrypt.js), [Speakeasy](https://github.com/speakeasyjs/speakeasy) (2FA).
*   **Utilidades:** [Nodemailer](https://nodemailer.com/), [Zod](https://zod.dev/), [Node-Cron](https://github.com/node-cron/node-cron).

---

## 📁 Estructura del Proyecto

```text
parking-backend/
├── prisma/               # Schema, modelos y migraciones de BD
├── src/
│   ├── config/           # Configuraciones (DB, Env, Mailer)
│   ├── controllers/      # Handlers de rutas (Lógica de entrada/salida)
│   ├── middlewares/      # Filtros de seguridad (Auth, Rate Limit)
│   ├── routes/           # Definición de rutas de la API
│   ├── services/         # Lógica de negocio core
│   ├── schemas/          # Validaciones de datos con Zod
│   ├── utils/            # Herramientas (Cifrado, JWT, Password)
│   ├── types/            # Tipado global de TypeScript
│   ├── app.ts            # Configuración de Fastify y plugins
│   └── server.ts         # Arranque del servidor
├── tests/                # Suites de pruebas (Vitest + Supertest)
└── plans/                # Roadmap, documentación de APIs y diseño
```

---

## 🚀 Instalación y Despliegue

### 1. Variables de Entorno
Renombrar `.env.example` a `.env` y configurar las llaves esenciales:
*   `DATABASE_URL`: Conexión a Postgres.
*   `JWT_SECRET` & `JWT_REFRESH_SECRET`.
*   `ENCRYPTION_KEY`: Generar con `openssl rand -hex 32`.
*   Credenciales SMTP para notificaciones por correo.

### 2. Levantar Infraestructura (Docker)
El proyecto incluye un entorno listo con Postgres, PostGIS, Redis y pgAdmin:
```bash
npm run docker:up
```

### 3. Inicializar Base de Datos
```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Ejecución
```bash
# Modo Desarrollo (Hot reload)
npm run dev

# Construcción y Producción
npm run build
npm run start
```

---

## 🧪 Calidad y Testing

Se utilizan **Vitest** y **Supertest** para asegurar el correcto funcionamiento de los flujos críticos.
```bash
# Correr suite completa
npm test

# Modo UI (Interactivo)
npm run test:ui
```

---

## 🔌 API Endpoints

Debido a la extensión de la API, la documentación detallada de cada endpoint, sus parámetros y formatos de respuesta se ha movido a su propio archivo:

👉 **[Documentación Detallada de Endpoints](plans/endpoints.md)**

### Resumen de Rutas Principales:
| Módulo | Prefijo | Descripción |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, Registro, 2FA, Recuperación. |
| **Parkings** | `/api/parkings` | Búsqueda GPS y gestión de parkings. |
| **Reservas** | `/api/reservations` | Ciclo de vida de la reserva y check-in. |
| **Pagos** | `/api/payments` | Reporte y verificación de transacciones. |
| **Loyalty** | `/api/loyalty` | Gestión de puntos y niveles de usuario. |
| **Analytics** | `/api/analytics`| Métricas y reportes administrativos. |

---

## 🗺️ Roadmap
Consulta el estado de las fases de desarrollo, desde los cimientos hasta el despliegue cloud en el [Roadmap del Proyecto](plans/roadmap.md).

---
*Backend v1.0 - Fase de Seguridad Completada*
