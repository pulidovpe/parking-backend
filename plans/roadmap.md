# Roadmap de Desarrollo - Parking Backend

Este documento detalla los pasos planeados para la evolución del backend.

## 🏁 Fase 1: Cimientos y Autenticación (Actual)
- [x] Configuración inicial del proyecto (Fastify + TS + Prisma).
- [x] Configuración de Docker para PostgreSQL.
- [x] Implementación de modelos de usuario en Prisma.
- [x] Autenticación básica (Registro y Login con JWT).
- [ ] Documentación inicial (README).

## 🏗️ Fase 2: Gestión de Parqueaderos
- [ ] **Modelo de Datos:** Crear modelos para `ParkingLot`, `Spot` (espacio de parqueo).
- [ ] **Geolocalización:** Integrar PostGIS para búsqueda de parqueaderos cercanos.
- [ ] **CRUD de Parqueaderos:** Endpoints para crear, listar, actualizar y eliminar parqueaderos.
- [ ] **Gestión de Espacios:** Definir tipos de espacios (Carro, Moto, Bicicleta) y su disponibilidad.

## 📅 Fase 3: Reservas y Disponibilidad
- [ ] **Modelo de Reservas:** Crear modelo `Reservation` con estados (PENDING, ACTIVE, COMPLETED, CANCELLED).
- [ ] **Lógica de Reservas:** 
  - Validar disponibilidad antes de reservar.
  - Bloqueo temporal de espacios.
  - Finalización de estadía y cálculo de costos.

## 💰 Fase 4: Pagos y Facturación
- [ ] **Integración de Pagos:** Implementar pasarela de pagos (e.g., Stripe, Wompi).
- [ ] **Historial de Transacciones:** Registro de cobros y estados de pago.
- [ ] **Generación de Recibos:** PDF o JSON detallado del servicio prestado.

## 🛡️ Fase 5: Roles y Permisos Avanzados
- [ ] Middlewares de autorización basados en roles (`ADMIN`, `PARKING_MANAGER`).
- [ ] Panel administrativo para gestión global.

## 🚀 Fase 6: Optimizaciones y Despliegue
- [ ] Implementación de Cache con Redis para búsquedas frecuentes.
- [ ] Tests Unitarios y de Integración (Jest/Vitest).
- [ ] Configuración de CI/CD.
- [ ] Despliegue en Cloud (AWS/DigitalOcean).
