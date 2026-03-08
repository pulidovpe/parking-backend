# Roadmap de Desarrollo - Parking Backend

Este documento detalla las fases de desarrollo del proyecto, integrando el progreso actual y los próximos pasos.

## ✅ Fase 1: Cimientos e Infraestructura
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

## 🏗️ Fase 2: Sistema de Reservas
- [x] **1G: Reservas:** Ciclo de vida completo, validación de rangos y notificaciones básicas.
  - [x] Definición del modelo de datos para Reservas.
  - [x] Lógica de creación y cancelación de reservas.
  - [x] Validación automática de disponibilidad en tiempo real por rango de tiempo.
  - [x] Historial de reservas por usuario. (`GET /my-history`)
  - [x] Sistema de notificaciones básicas.

## 💰 Fase 3: Sistema de Pagos
- [x] **1H: Pagos (Enfoque Local):** Reporte de pago móvil, verificación manual y soporte multivaluta (USD/VES).
  - [x] Modelo de Base de Datos (Transaction con soporte multivaluta).
  - [x] Endpoint de Reporte (Cálculo automático de USD/VES).
  - [x] Validación de Seguridad (Usuario correcto vs Reserva).
  - [x] Flujo de Verificación (Manager aprueba -> Reserva se activa).
  - [x] Historial de Transacciones (Usuario).
  - [x] Métricas Financieras (Manager).
- [x] 1H.1: Sincronización de Conciliación (NUEVO): Persistencia de datos del emisor para evitar pérdida de información del Frontend.
  - [x] Schema Update (prisma/schema.prisma): Adición de campos senderBank, senderPhone y senderEmail.
  - [x] DTO Update (payment.types.ts): Inclusión de campos opcionales para datos de emisor.
  - [x] Validation (payment.schema.ts): Esquema Zod para validar senderBank, senderPhone y senderEmail.
  - [x] Service Logic (payment.service.ts): Mapeo de nuevos campos y persistencia del campo metadata (JSON) para capturas de pantalla.
  - [x] Controller Update (payment.controller.ts): Ajuste en la captura del body y extracción robusta de IDs de usuario.
  

## 🎁 Fase 4: Fidelización y Gamificación
- [x] **1I: Sistema de Puntos:** Membresías (Bronce/Plata/Oro), acumulación y canje de puntos.
  - [x] Lógica de acumulación automática de puntos.
  - [x] Niveles de membresía (Bronce, Plata, Oro).
  - [x] Descuentos progresivos por nivel.
  - [x] Canje de puntos por beneficios (Pagar reserva con puntos).
  - [x] Historial de puntos (Endpoint /loyalty/me).
  - [x] Notificaciones de logros.

## 📊 Fases 5: Analytics y Reportes
- [ ] **1J: Dashboard para managers con métricas:** Métricas de ocupación, ingresos, usuarios frecuentes y exportación CSV.
  - [x] Estadísticas de ocupación por día/semana/mes.
  - [x] Ingresos totales y proyecciones.
  - [x] Usuarios más frecuentes.
  - [x] Horarios pico y valle.
  - [x] Reportes exportables (CSV).
  - [x] Gráficas de tendencias.
  - [ ] Comparación entre parkings.

## 🔔 FASE 6: Notificaciones Avanzadas (COMPLETADA) ✅
- [x] **1K:Sistema de alertas por email:** Emails transaccionales, recordatorios y alertas de vencimiento.
  - [x] Configuración de Nodemailer / Mailtrap (Ethereal).
  - [x] Emails transaccionales (Bienvenida).
  - [x] Confirmación de reserva.
  - [x] Notificación de pago recibido.
  - [x] Recordatorio 30 min antes (Cron Job activo).
  - [x] Alerta de tiempo próximo a vencer (Cron Job activo).
  - [x] Plantillas de notificaciones HTML.

## ⏰ FASE 7: Sistema de Expiración Automática (COMPLETADA) ✅
- [x] **1L: Automatización de estados:** Limpieza automática de reservas pendientes y expiradas.
  - [x] Job scheduler (cron) configurado y corriendo.
  - [x] Expirar reservas PENDING no activadas (Limpieza automática basada en `startTime`).
  - [x] Liberar espacios automáticamente.

## 🔒 FASE 8: Seguridad Avanzada (COMPLETADA) ✅
- [x] **1M: Blindaje de la API:**
  - [x] **Rate limiting:** Protección contra ataques de fuerza bruta.
  - [x] **Refresh Tokens:** Rotación de sesiones seguras.
  - [x] **Verificación de Identidad:** Email obligatorio.
  - [x] **Recuperación de Cuenta:** Reset password seguro.
  - [x] **Bloqueo Inteligente:** Suspensión tras 3 intentos fallidos.
  - [x] **2FA (MFA):** Integración TOTP (Setup, Enable, Disable).
  - [x] **Logout Seguro:** Revocación de tokens (Blacklist en Redis).
  - [x] **Auditoría Forense:** Logs inmutables de acciones críticas.

## ⚡ FASE 9: Optimización y Escala
- [x] **1N: Rendimiento:**
  - [x] Implementación de Cache con Redis.
  - [x] Optimización de consultas SQL/Prisma.
- [x] **1O: Calidad:**
  - [x] Configuración de Vitest + Supertest.
  - [x] Tests de Autenticación.
  - [x] Tests de Reservas.

## ✅ FASE 10: DevOps y Despliegue (COMPLETADA)
- [x] **1P: CI/CD (GitHub Actions):**
  - [x] Pipeline de Integración Continua.
  - [x] Pipeline de Despliegue (Docker + AWS).
- [x] **1Q: Infraestructura Cloud (AWS):**
  - [x] Provisionamiento EC2 + Terraform.
  - [x] Docker Compose Producción.
  - [x] Verificación de salud (`/health`).

## 🚀 FASE 11: Seguridad y Acceso Público (SIGUIENTE)
- [ ] **1R: Dominio y SSL:**
  - [ ] Configurar Nginx como Reverse Proxy.
  - [ ] Obtener certificados SSL gratuitos.
  - [ ] Configurar dominio personalizado.

## 👮‍♂️ FASE 12: Administración y Control (NUEVO)
*Funcionalidades exclusivas para Managers y Admins para gestión operativa.*

- [ ] **1S: Gestión de Usuarios (Admin):**
  - [ ] Endpoint para listar usuarios con paginación (`GET /admin/users`).
  - [ ] Endpoint para bloquear/desbloquear usuarios (`PATCH /admin/users/:id/status`).
  - [ ] Endpoint para cambiar roles (Promover a Manager).

- [ ] **1T: Auditoría Visual (Admin):**
  - [ ] Endpoint para consultar logs de auditoría (`GET /admin/audit-logs`).
  - [ ] Filtros por fecha, usuario y tipo de acción.

- [ ] **1U: Operaciones de Campo (Manager):**
  - [ ] Reserva manual ("Walk-in") para clientes sin app.
  - [ ] Bloqueo de mantenimiento para espacios específicos.