# Parking Backend 🚗🅿️

Backend para el sistema de gestión de parqueaderos, desarrollado con un stack moderno y escalable.

## 🛠️ Stack Tecnológico

- **Runtime:** [Node.js](https://nodejs.org/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Fastify](https://www.fastify.io/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) con **PostGIS** (Geolocalización) y **Redis** (Cache)
- **Email:** [Nodemailer](https://nodemailer.com/) con soporte para plantillas HTML y previsualización.
- **Validación:** [Zod](https://zod.dev/)
- **Autenticación:** [JWT](https://jwt.io/) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Logging:** [Pino](https://getpino.io/) con `pino-pretty`

## 🚀 Estado Actual del Proyecto

El proyecto ha evolucionado hacia un sistema integral de gestión de estacionamientos con soporte para pagos, fidelización y analíticas avanzadas.

### Funcionalidades implementadas:
- ✅ **Base Sólida:** Configuración de Fastify, TypeScript, Docker y Prisma.
- ✅ **Autenticación y Seguridad:** Registro, login seguro (JWT) y roles de usuario (DRIVER, MANAGER, ADMIN).
- ✅ **Gestión Geográfica:** Búsqueda de parqueaderos cercanos mediante **PostGIS** y gestión de coordenadas.
- ✅ **Control de Espacios:** Administración de niveles y puestos con estados en tiempo real (Disponible, Ocupado, Reservado).
- ✅ **Sistema de Reservas:** Flujo completo de creación, activación, cancelación y finalización de reservas con validación de disponibilidad.
- ✅ **Gestión de Pagos:** Reporte de pagos multivaluta (USD/VES), verificación por managers y soporte para pagos con puntos.
- ✅ **Fidelización (Loyalty):** Sistema de puntos acumulables por uso, niveles de membresía (Bronce, Plata, Oro) y beneficios progresivos.
- ✅ **Analytics:** Dashboard para managers con KPIs de ingresos, ocupación, usuarios frecuentes y exportación de reportes a CSV.
- ✅ **Notificaciones:** Envío de correos automáticos para bienvenida, confirmación de reserva y recibos de pago.

## 🔌 Endpoints Principales

La API está organizada en módulos. Todos los endpoints (excepto Auth) requieren un token JWT en el header `Authorization`.

### 🔐 Autenticación
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registro de nuevos usuarios. |
| `POST` | `/api/auth/login` | Inicio de sesión y obtención de token. |

### 🚗 Estacionamientos y Espacios
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/parkings/nearby` | Buscar parqueaderos cercanos (PostGIS). |
| `GET` | `/api/spaces/parking/:id` | Ver disponibilidad en tiempo real de un parking. |
| `POST` | `/api/spaces/bulk` | Creación masiva de espacios (Admin/Manager). |

### 📅 Reservas
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/reservations` | Crear una nueva reserva. |
| `PATCH` | `/api/reservations/:id/activate` | Iniciar ocupación del espacio. |
| `GET` | `/api/reservations/my-history` | Historial de reservas del usuario. |

### 💸 Pagos y Fidelidad
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/payments/report` | Reportar un pago (Pago Móvil, Zelle, etc). |
| `PUT` | `/api/payments/:id/verify` | Validar pago reportado (Solo Manager). |
| `GET` | `/api/loyalty/me` | Ver puntos acumulados y nivel de membresía. |

### 📊 Analytics (Solo Managers)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/analytics/dashboard` | KPIs principales (Ingresos, Ocupación). |
| `GET` | `/api/analytics/export` | Exportar reporte de transacciones a CSV. |

## 📂 Estructura del Proyecto

```text
src/
├── config/      # Configuraciones de DB, Mailer, entorno y PostGIS
├── controllers/ # Lógica de los endpoints (Auth, Parking, Space, Payments, etc.)
├── middlewares/ # Protección de rutas y validaciones
├── routes/      # Definición de rutas del sistema
├── services/    # Lógica de negocio y servicios externos (Email, Analytics)
├── schemas/     # Validaciones de esquemas con Zod
├── types/       # Definiciones de tipos e interfaces de TypeScript
├── utils/       # Utilidades de seguridad y procesamiento
├── app.ts       # Configuración global de la app
└── server.ts    # Punto de entrada
prisma/
└── schema.prisma # Modelado de datos relacional y PostGIS
```

## 🗺️ Roadmap
Puedes consultar el plan detallado de desarrollo y las fases futuras en el [Roadmap de Desarrollo](plans/roadmap.md).

## 🛠️ Configuración para Desarrollo

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` y ajusta los valores necesarios, incluyendo los de SMTP para el sistema de correos.

3. **Levantar infraestructura (Docker):**
   ```bash
   npm run docker:up
   ```

4. **Sincronizar base de datos:**
   ```bash
   npm run prisma:migrate
   ```

5. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

---
*Este archivo se actualiza dinámicamente según el progreso del backend.*
