# Roadmap de Desarrollo - Parking Backend

Este documento detalla las fases de desarrollo del proyecto, integrando el progreso actual y los próximos pasos.

## ✅ Fase 1: Cimientos e Infraestructura
- [x] **1A: Setup Base:** Node.js, TypeScript y Fastify configurados.
- [x] **1B: Infraestructura:** Docker Compose con PostgreSQL, Redis y pgAdmin.
- [x] **1C: Base de Datos:** Prisma ORM integrado y migraciones iniciales.
- [x] **1D: Autenticación:** Registro, Login, JWT y validaciones con Zod.
- [x] **1E: Gestión de Estacionamientos:** Implementación de CRUD de parqueaderos, integración con PostGIS para geolocalización y búsqueda por cercanía.
- [x] **1F: Gestión de Espacios (Parking Spaces):**
  - [x] CRUD de espacios individuales (`ParkingSpace`).
  - [x] Organización por niveles (`ParkingLevel`).
  - [x] Creación masiva de espacios (Bulk creation).
  - [x] Dashboard de disponibilidad en tiempo real y filtros avanzados.

## 🏗️ Fase 2: Sistema de Reservas (Próxima Fase)
- [ ] **1G: Reservas:**
  - [x] Definición del modelo de datos para Reservas.
  - [x] Lógica de creación y cancelación de reservas.
  - [x] Validación automática de disponibilidad en tiempo real por rango de tiempo.
  - [ ] Historial de reservas por usuario.
  - [ ] Sistema de notificaciones básicas.

## 💰 Fase 3: Sistema de Pagos
- [x] **1H: Pagos (Enfoque Local):**
  - [x] Modelo de Base de Datos (Transaction con soporte multivaluta).
  - [x] Endpoint de Reporte (Cálculo automático de USD/VES).
  - [x] Validación de Seguridad (Usuario correcto vs Reserva).
  - [x] Flujo de Verificación (Manager aprueba -> Reserva se activa).
  - [x] Historial de Transacciones (Usuario).
  - [x] Métricas Financieras (Manager).

## 🎁 Fase 4: Fidelización y Gamificación
- [ ] **1I: Sistema de Puntos:**
  - [x] Lógica de acumulación automática de puntos.
  - [x] Niveles de membresía (Bronce, Plata, Oro).
  - [x] Canje de puntos por descuentos o beneficios.
  - [ ] El sistema cobra la tarifa full sin importar si eres Platino.
  - [ ] No hay lógica para dar puntos extra al "usuario frecuente".
  - [ ] Tienes puntos, pero no puedes usarlos para nada.
  - [x] Notificaciones. Solo console.log. El envío de emails es Fase 1K.

## 📊 Fases 5: Analytics y Reportes
- [ ] **1J: Dashboard para managers con métricas:**
  - [ ] Estadísticas de ocupación por día/semana/mes
  - [ ] Ingresos totales y proyecciones
  - [ ] Usuarios más frecuentes
  - [ ] Horarios pico y valle
  - [ ] Tasa de cancelación
  - [ ] Tiempo promedio de estacionamiento
  - [ ] Reportes exportables (PDF/CSV/Excel)
  - [ ] Gráficas de tendencias
  - [ ] Comparación entre parkings

## 🔔 FASE 6: Notificaciones Avanzadas
- [ ] **1K:Sistema de alertas por email/SMS:**
  - [ ] Confirmación de reserva
  - [ ] Recordatorio 30 min antes
  - [ ] Alerta de tiempo próximo a vencer
  - [ ] Notificación de pago recibido
  - [ ] Emails transaccionales
  - [ ] SMS para eventos críticos (opcional)
  - [ ] Plantillas de notificaciones

## ⏰ FASE 7: Sistema de Expiración Automática
- [ ] **1L: Automatización de estados:**
  - [ ] Job scheduler (cron) para verificar reservas
  - [ ] Expirar reservas PENDING no activadas (ej: después de 15 min)
  - [ ] Liberar espacios automáticamente
  - [ ] Alertas antes de expiración
  - [ ] Penalizaciones por no show (opcional)

## 🔒 FASE 8: Seguridad Avanzada
- [ ] **1M: Mejoras de seguridad:**
  - [ ] Rate limiting por IP
  - [ ] Refresh tokens para JWT
  - [ ] Verificación de email
  - [ ] Recuperación de contraseña
  - [ ] 2FA (opcional)
  - [ ] Logs de auditoría
  - [ ] Encriptación de datos sensibles

- [ ] **Optimización:** Implementación de Cache con Redis y tests de calidad.
- [ ] **Despliegue:** Configuración de CI/CD.
