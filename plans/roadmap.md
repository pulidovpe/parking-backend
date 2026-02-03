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
  - [x] Sistema de notificaciones básicas. (Implementado en FASE 1K)

## 💰 Fase 3: Sistema de Pagos
- [x] **1H: Pagos (Enfoque Local):** Reporte de pago móvil, verificación manual y soporte multivaluta (USD/VES).
  - [x] Modelo de Base de Datos (Transaction con soporte multivaluta).
  - [x] Endpoint de Reporte (Cálculo automático de USD/VES).
  - [x] Validación de Seguridad (Usuario correcto vs Reserva).
  - [x] Flujo de Verificación (Manager aprueba -> Reserva se activa).
  - [x] Historial de Transacciones (Usuario).
  - [x] Métricas Financieras (Manager).

## 🎁 Fase 4: Fidelización y Gamificación
- [x] **1I: Sistema de Puntos:** Membresías (Bronce/Plata/Oro), acumulación y canje de puntos.
  - [x] Lógica de acumulación automática de puntos.
  - [x] Niveles de membresía (Bronce, Plata, Oro).
  - [x] Descuentos progresivos por nivel.
  - [x] Canje de puntos por beneficios (Pagar reserva con puntos).
  - [x] Historial de puntos (Endpoint /loyalty/me).
  - [x] Notificaciones de logros (Console logs implementados).

## 📊 Fases 5: Analytics y Reportes
- [ ] **1J: Dashboard para managers con métricas:** Métricas de ocupación, ingresos, usuarios frecuentes y exportación CSV.
  - [x] Estadísticas de ocupación por día/semana/mes (Cubierto por `getOccupancyHeatmap` y KPIs).
  - [x] Ingresos totales y proyecciones (Ingresos listos en `getRevenueChart`; Proyecciones movidas a fases futuras de IA).
  - [x] Usuarios más frecuentes (Cubierto por `getTopUsers`).
  - [x] Horarios pico y valle (Cubierto por `getOccupancyHeatmap`).
  - [x] Reportes exportables (PDF/CSV/Excel) (Cubierto por endpoint `/export` en CSV).
  - [x] Gráficas de tendencias (Cubierto por `getRevenueChart`).
  - [ ] Comparación entre parkings (Pendiente menor, el dashboard actual agrupa todo).

## 🔔 FASE 6: Notificaciones Avanzadas
- [ ] **1K:Sistema de alertas por email/SMS:** Emails transaccionales, recordatorios y alertas de vencimiento.
  - [x] Configuración de Nodemailer / Mailtrap (Ethereal).
  - [x] Emails transaccionales (Bienvenida).
  - [x] Confirmación de reserva.
  - [x] Notificación de pago recibido.
  - [x] Recordatorio 30 min antes (Depende de Fase 1L: Cron Jobs).
  - [x] Alerta de tiempo próximo a vencer (Depende de Fase 1L: Cron Jobs).
  - [x] Plantillas de notificaciones (El HTML actual ya cumple esta función).
  - [ ] SMS para eventos críticos (POSTERGADO a migración AWS).

## ⏰ FASE 7: Sistema de Expiración Automática
- [ ] **1L: Automatización de estados:** Limpieza automática de reservas pendientes y expiradas.
  - [x] Job scheduler (cron) configurado y corriendo.
  - [x] Expirar reservas PENDING no activadas (Limpieza automática).
  - [x] Liberar espacios automáticamente.

## 🔒 FASE 8: Seguridad Avanzada (COMPLETADA) ✅
- [x] **1M: Blindaje de la API:**
  - [x] **Rate limiting:** Protección contra ataques de fuerza bruta y DDoS.
  - [x] **Refresh Tokens:** Rotación de sesiones seguras.
  - [x] **Verificación de Identidad:** Email obligatorio para activar cuenta.
  - [x] **Recuperación de Cuenta:** Flujo seguro de reset password con tokens cortos.
  - [x] **Bloqueo Inteligente:** Suspensión temporal tras 3 intentos fallidos.
  - [x] **2FA (MFA):** Integración con Google Authenticator (TOTP).
  - [x] **Auditoría Forense:** Logs inmutables de acciones críticas en BD.
  - [x] **Encriptación:** Cifrado AES-256 para secretos en reposo.

## ⚡ FASE 9: Optimización y Escala
- [x] **1N: Rendimiento:**
  - [x] Implementación de Cache con Redis para rutas de lectura frecuente.
  - [x] Optimización de consultas SQL/Prisma (Cubierto con índices en Schema y Redis).
- [x] **1O: Calidad:**
  - [x] Configuración de Vitest + Supertest.
  - [x] Tests de Autenticación (Registro, Login, Bloqueo).
  - [x] Tests de Reservas (Creación, Conflictos, Historial).

## ✅ FASE 10: DevOps y Despliegue (COMPLETADA)
- [x] **1P: CI/CD (GitHub Actions):**
  - [x] Pipeline de Integración Continua (Tests automatizados).
  - [x] Pipeline de Despliegue (Build Docker + AWS ECR con OIDC).
- [x] **1Q: Infraestructura Cloud (AWS):**
  - [x] Provisionamiento de Servidor EC2 con Terraform.
  - [x] Configuración de Docker Compose en Producción (App + PostGIS + Redis).
  - [x] Despliegue exitoso y verificación de salud (`/health`).

## 🚀 FASE 11: Seguridad y Acceso Público (SIGUIENTE)
- [ ] **1R: Dominio y SSL:**
  - [ ] Configurar Nginx como Reverse Proxy.
  - [ ] Obtener certificados SSL gratuitos (Let's Encrypt / Certbot).
  - [ ] Configurar dominio personalizado (si tienes uno) o usar DNS público.