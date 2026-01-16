# Parking Backend 🚗🅿️

Backend para el sistema de gestión de parqueaderos, desarrollado con un stack moderno y escalable.

## 🛠️ Stack Tecnológico

- **Runtime:** [Node.js](https://nodejs.org/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Fastify](https://www.fastify.io/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) (con extensión PostGIS para geolocalización)
- **Validación:** [Zod](https://zod.dev/)
- **Autenticación:** [JWT](https://jwt.io/) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Logging:** [Pino](https://getpino.io/)

## 🚀 Estado Actual del Proyecto

Actualmente, el proyecto cuenta con la base estructural y el módulo de autenticación inicial.

### Funcionalidades implementadas:
- ✅ Configuración base de Fastify con TypeScript.
- ✅ Conexión a base de Datos PostgreSQL mediante Prisma.
- ✅ Módulo de Autenticación:
  - `POST /api/auth/register`: Registro de nuevos usuarios.
  - `POST /api/auth/login`: Inicio de sesión y generación de JWT.
- ✅ Endpoints de utilidad:
  - `GET /health`: Estado de salud del servidor.
  - `GET /db-test`: Verificación de conexión con la base de datos.

## 📂 Estructura del Proyecto

```text
src/
├── config/      # Configuraciones de base de datos y variables de entorno
├── controllers/ # Lógica de los endpoints
├── routes/      # Definición de rutas (Fastify plugins)
├── services/    # Lógica de negocio
├── schemas/     # Validaciones con Zod
├── utils/       # Utilidades (JWT, Passwords, etc.)
├── app.ts       # Configuración de la aplicación
└── server.ts    # Punto de entrada del servidor
prisma/
└── schema.prisma # Definición del modelo de datos
```

## 🛠️ Configuración para Desarrollo

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` y ajusta los valores.

3. **Levantar base de datos (Docker):**
   ```bash
   npm run docker:up
   ```

4. **Ejecutar migraciones de Prisma:**
   ```bash
   npm run prisma:migrate
   ```

5. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

---
## 🗺️ Roadmap
Puedes consultar el plan detallado de desarrollo en el [Roadmap de Desarrollo](plans/roadmap.md).

---
*Este archivo se actualiza a medida que el proyecto avanza.*
