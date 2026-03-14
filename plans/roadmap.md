# 🗺️ Roadmap de Desarrollo - Parking Backend

Este documento detalla las fases de desarrollo del proyecto, integrando el progreso actual y los próximos pasos.

---

## ✅ Fase 1: Cimientos e Infraestructura (COMPLETADA)
- [x] **1A: Setup Base:** Node.js, TypeScript y Fastify configurados.
- [x] **1B: Infraestructura:** Docker Compose con PostgreSQL, Redis y pgAdmin.
- [x] **1C: Base de Datos:** Prisma ORM integrado y migraciones iniciales.
- [x] **1D: Autenticación:** Registro, Login, JWT y validaciones con Zod.
- [x] **1E: Gestión de Estacionamientos:** CRUD, PostGIS y geolocalización.
- [x] **1F: Gestión de Espacios:** CRUD espacios, niveles y disponibilidad.
  - [x] CRUD de espacios individuales (`ParkingSpace`).
  - [x] Organización por niveles (`ParkingLevel`).
  - [x] Creación masiva de espacios (Bulk creation).
  - [x] Dashboard de disponibilidad en tiempo real y filtros avanzados.

---

## ✅ Fase 2: Sistema de Reservas (COMPLETADA)
- [x] **1G: Reservas:** Ciclo de vida completo, validación de rangos y notificaciones básicas.
  - [x] Definición del modelo de datos para Reservas.
  - [x] Lógica de creación y cancelación de reservas.
  - [x] Validación automática de disponibilidad en tiempo real por rango de tiempo.
  - [x] Historial de reservas por usuario. (`GET /my-history`)
  - [x] Sistema de notificaciones básicas.

---

## ✅ Fase 3: Sistema de Pagos (COMPLETADA)
- [x] **1H: Pagos (Enfoque Local):** Reporte de pago móvil, verificación manual y soporte multivaluta (USD/VES).
  - [x] Modelo de Base de Datos (Transaction con soporte multivaluta).
  - [x] Endpoint de Reporte (Cálculo automático de USD/VES).
  - [x] Validación de Seguridad (Usuario correcto vs Reserva).
  - [x] Flujo de Verificación (Manager aprueba → Reserva se activa).
  - [x] Historial de Transacciones (Usuario).
  - [x] Métricas Financieras (Manager).
- [x] **1H.1: Sincronización de Conciliación:** Persistencia de datos del emisor.
  - [x] Schema Update: Adición de campos `senderBank`, `senderPhone` y `senderEmail`.
  - [x] DTO Update: Inclusión de campos opcionales para datos de emisor.
  - [x] Validation: Esquema Zod para validar campos de emisor.
  - [x] Service Logic: Mapeo de nuevos campos y persistencia del campo `metadata` (JSON).
  - [x] Controller Update: Extracción robusta de IDs de usuario.
- [x] **1H.2: Fix lógica de verificación de pagos:**
  - [x] `verifyTransaction` ya no sobreescribe el estado de reservas `COMPLETED` o `ACTIVE`.
  - [x] Solo activa la reserva si estaba en `PENDING` al momento de verificar.

---

## ✅ Fase 4: Fidelización y Gamificación (COMPLETADA)
- [x] **1I: Sistema de Puntos:** Membresías (Bronce/Plata/Oro), acumulación y canje de puntos.
  - [x] Lógica de acumulación automática de puntos.
  - [x] Niveles de membresía (Bronce, Plata, Oro).
  - [x] Descuentos progresivos por nivel.
  - [x] Canje de puntos por beneficios (Pagar reserva con puntos).
  - [x] Historial de puntos (Endpoint `/loyalty/me`).
  - [x] Notificaciones de logros.

---

## ✅ Fase 5: Analytics y Reportes (COMPLETADA)
- [x] **1J: Dashboard para managers con métricas.**
  - [x] Estadísticas de ocupación por día/semana/mes.
  - [x] Ingresos totales y proyecciones.
  - [x] Usuarios más frecuentes.
  - [x] Horarios pico y valle.
  - [x] Reportes exportables (CSV).
  - [x] Gráficas de tendencias.
  - [ ] Comparación entre parkings. *(pendiente)*

---

## ✅ Fase 6: Notificaciones por Email (COMPLETADA)
- [x] **1K: Sistema de alertas por email.**
  - [x] Configuración de Nodemailer / Ethereal.
  - [x] Emails transaccionales (Bienvenida, Confirmación de reserva).
  - [x] Notificación de pago recibido y recibo.
  - [x] Recordatorio 30 min antes (Cron Job activo).
  - [x] Alerta de tiempo próximo a vencer (Cron Job activo).
  - [x] Plantillas HTML.

---

## ✅ Fase 7: Sistema de Expiración Automática (COMPLETADA)
- [x] **1L: Automatización de estados.**
  - [x] Job scheduler (cron) configurado y corriendo.
  - [x] Expirar reservas `PENDING` no activadas (basado en `startTime` + 15 min de gracia).
  - [x] Liberar espacios automáticamente al expirar.

---

## ✅ Fase 8: Seguridad Avanzada (COMPLETADA)
- [x] **1M: Blindaje de la API.**
  - [x] Rate limiting global contra fuerza bruta.
  - [x] Refresh Tokens con rotación de sesiones.
  - [x] Verificación de identidad por email obligatoria.
  - [x] Recuperación de cuenta (reset password seguro).
  - [x] Bloqueo automático tras 3 intentos fallidos.
  - [x] 2FA / MFA con TOTP (Google Authenticator / Authy).
  - [x] Logout seguro con blacklist de tokens en Redis.
  - [x] Audit logs inmutables de acciones críticas.

---

## ✅ Fase 9: Optimización y Calidad (COMPLETADA)
- [x] **1N: Rendimiento.**
  - [x] Cache inteligente con Redis (`CacheService`).
  - [x] Optimización de consultas SQL/Prisma.
- [x] **1O: Testing.**
  - [x] Configuración de Vitest + Supertest.
  - [x] Tests de autenticación.
  - [x] Tests de reservas.

---

## ✅ Fase 10: DevOps y Despliegue Cloud (COMPLETADA)
- [x] **1P: CI/CD (GitHub Actions).**
  - [x] Pipeline de Integración Continua.
  - [x] Pipeline de Despliegue (Docker + AWS ECR).
- [x] **1Q: Infraestructura Cloud (AWS).**
  - [x] Provisionamiento EC2 + Terraform.
  - [x] Docker Compose para producción.
  - [x] Health check (`/health`) operativo.

---

## ✅ Fase 11: Tiempo Real — WebSockets (COMPLETADA)

### WS-1: Infraestructura base ✅
- [x] Instalación de `@fastify/websocket`.
- [x] Definición de tipos y payloads de eventos (`src/websockets/ws.events.ts`).
- [x] Room Manager por `userId` y `parkingId` (`src/websockets/ws.room-manager.ts`).
- [x] WS Service con Redis Pub/Sub desacoplado (`src/services/ws.service.ts`).
- [x] Gateway con autenticación JWT en el handshake (`src/websockets/ws.gateway.ts`).
- [x] Heartbeat nativo ping/pong del protocolo WebSocket (RFC 6455).
- [x] Integración en `app.ts` (registro del gateway + inicialización del subscriber).

### WS-2: Eventos de negocio ✅
- [x] `payment:verified` / `payment:rejected` → usuario que realizó el pago.
- [x] `reservation:status_changed` (ACTIVE, COMPLETED, CANCELLED) → usuario propietario.
- [x] `reservation:expiring_soon` → usuario con reserva activa próxima a vencer (desde cron).
- [x] `space:availability_updated` → broadcast al room del parking (mapa en vivo).

### WS-3: Seguridad y robustez ✅
- [x] Validación de blacklist JWT en el handshake (tokens revocados son rechazados con 1008).
- [x] Rate limiting de conexiones WS por IP (máx. 5 simultáneas).
- [x] Handler async seguro con IIFE + catch global para evitar crashes silenciosos.
- [x] Handler `close` consolidado (limpieza de contador IP + room manager en un solo evento).

---

## 🔄 Fase 12: Hardening de Seguridad (PRÓXIMA)

- [ ] **Reemplazar `speakeasy`** por `@otplib/preset-default` (abandonada desde 2019).
- [ ] **Unificar librerías JWT:** eliminar `jsonwebtoken`, usar solo `@fastify/jwt`.
  - [ ] Estandarizar payload: `{ userId, email, role }` en todos los tokens.
  - [ ] Eliminar el patrón defensivo `req.user.id || req.user.userId || req.user.sub`.
- [ ] **Migrar `bcryptjs` → `bcrypt`** nativo (mejor rendimiento en ARM / M4 Pro).
- [ ] **Configurar Nginx** como Reverse Proxy con SSL/TLS.
- [ ] **Certificados SSL** (Let's Encrypt / AWS ACM).
- [ ] **Dominio personalizado** configurado.

---

## 🔮 Fase 13: Administración y Control (PENDIENTE)

- [ ] **1S: Gestión de Usuarios (Admin).**
  - [ ] Listar usuarios con paginación (`GET /admin/users`).
  - [ ] Bloquear/desbloquear usuarios (`PATCH /admin/users/:id/status`).
  - [ ] Cambio de roles (promover a Manager).
- [ ] **1T: Auditoría Visual (Admin).**
  - [ ] Consultar logs de auditoría (`GET /admin/audit-logs`).
  - [ ] Filtros por fecha, usuario y tipo de acción.
- [ ] **1U: Operaciones de Campo (Manager).**
  - [ ] Reserva manual "Walk-in" para clientes sin app.
  - [ ] Bloqueo de mantenimiento para espacios específicos.

---

## 🚀 Fase 14: Integraciones Externas (PENDIENTE)

- [ ] **Pagos digitales venezolanos.**
  - [ ] Integración con pasarela de pago local.
  - [ ] QR para pagos móviles.
- [ ] **Push Notifications.**
  - [ ] Firebase Cloud Messaging (FCM) para app móvil.
  - [ ] Notificaciones en background.
- [ ] **Hardware IoT.**
  - [ ] API para sensores de ocupación.
  - [ ] Control de barreras de acceso.

---

## 📱 Fase 15: Aplicaciones Móviles (PENDIENTE)

- [ ] Definir stack del frontend móvil (React Native / Expo).
- [ ] App para conductores (iOS + Android).
- [ ] App para managers (panel de control móvil).
- [ ] Publicación en App Store y Google Play.

---

## 📝 Notas Técnicas

- **Convención de ramas:** `feat/`, `fix/`, `chore/`
- **Versionado:** Semántico (MAJOR.MINOR.PATCH)
- **Ambientes:** `development` → `staging` → `production`
- **Versión actual:** `v1.1.0` — WebSockets operativos (Fase 11 completa)
