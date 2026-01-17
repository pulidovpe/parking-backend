# Parking Backend 🚗🅿️

Backend para el sistema de gestión de parqueaderos, desarrollado con un stack moderno y escalable.

## 🛠️ Stack Tecnológico

- **Runtime:** [Node.js](https://nodejs.org/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Fastify](https://www.fastify.io/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) con **PostGIS** (Geolocalización)
- **Validación:** [Zod](https://zod.dev/)
- **Autenticación:** [JWT](https://jwt.io/) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Logging:** [Pino](https://getpino.io/) con `pino-pretty`

## 🚀 Estado Actual del Proyecto

El proyecto ha avanzado significativamente en sus módulos core.

### Funcionalidades implementadas:
- ✅ **Base Sólida:** Configuración de Fastify, TypeScript y Docker.
- ✅ **Módulo de Autenticación:** Registro y login seguro con JWT y protección de rutas mediante middlewares.
- ✅ **Gestión de Parqueaderos:**
  - Registro y actualización de parqueaderos con coordenadas geográficas.
  - Búsqueda de parqueaderos cercanos mediante **PostGIS**.
  - Soporte para múltiples niveles y organización de espacios.
- ✅ **Utilidades:** Health checks y tests de conexión a base de datos.

## 📂 Estructura del Proyecto

```text
src/
├── config/      # Configuraciones de DB, entorno y PostGIS
├── controllers/ # Lógica de los endpoints (Auth, Parking)
├── middlewares/ # Protección de rutas y validaciones
├── routes/      # Definición de rutas (Auth, Parking)
├── services/    # Lógica de negocio avanzada
├── schemas/     # Validaciones de esquemas con Zod
├── utils/       # Utilidades de seguridad y procesamiento
├── app.ts       # Configuración global de la app
└── server.ts    # Punto de entrada
prisma/
└── schema.prisma # Modelado de datos (User, Parking, Level, Space)
```

## 🗺️ Roadmap
Puedes consultar el plan detallado de desarrollo y las fases futuras en el [Roadmap de Desarrollo](plans/roadmap.md).

## 🛠️ Configuración para Desarrollo

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` y ajusta los valores necesarios.

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
