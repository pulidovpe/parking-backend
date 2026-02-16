# Documentación de Endpoints API - Parking Backend

Documentación técnica de la API RESTful, sincronizada con el código fuente (`src/routes/*.ts`).

**Base URL:** `/api`
**Autenticación:** Header `Authorization: Bearer <token>`

---

## 🔐 Autenticación (`/auth`)
Controlador: `AuthController`

| Método | Ruta | Descripción | Auth / Rol | Body (Entrada) | Respuesta Exitosa (Salida) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Registrar nuevo usuario | ❌ Público | `{ email, password, firstName, lastName, phone, role? }` | `{ success: true, message: "..." }` |
| `POST` | `/login` | Iniciar sesión | ❌ Público | `{ email, password, twoFactorCode? }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/refresh` | Refrescar Token | ❌ Público | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `GET` | `/verify` | Verificar email | ❌ Público | Query: `?token=...` | `{ success: true, message: "..." }` |
| `POST` | `/forgot-password` | Pedir reset pass | ❌ Público | `{ email }` | `{ success: true, message: "..." }` |
| `POST` | `/reset-password` | Cambiar password | ❌ Público | `{ token, newPassword }` | `{ success: true }` |
| `GET` | `/profile` | Ver perfil propio | ✅ Todos | - | `{ success: true, user: { ... } }` |
| `POST` | `/logout` | Cerrar sesión | ✅ Todos | - | `{ success: true, message: "Sesión cerrada" }` |
| `POST` | `/2fa/setup` | Generar QR 2FA | ✅ Todos | - | `{ success: true, data: { secret, qrCodeUrl } }` |
| `POST` | `/2fa/enable` | Activar 2FA | ✅ Todos | `{ token }` (Código 6 dígitos) | `{ success: true }` |
| `POST` | `/2fa/disable` | Desactivar 2FA | ✅ Todos | `{ code }` o `{ token }` | `{ success: true }` |

---

## 🅿️ Estacionamientos (`/parkings`)
Controlador: `ParkingController`

| Método | Ruta | Descripción | Auth / Rol | Body / Query | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Crear parking | ✅ Manager | `{ name, address, lat, lng, hourlyRate, is24Hours }` | Objeto `Parking` creado |
| `GET` | `/` | Listar mis parkings | ✅ Manager | - | `[ Parking, Parking... ]` |
| `GET` | `/search` | Buscar cercanos | ❌ Público | Query: `?lat=...&lng=...&radiusKm=...` | `[ { ...Parking, distance } ]` |
| `GET` | `/:id` | Ver detalle | ❌ Público | Param: `id` | `Parking` (incluye `spaces`) |
| `PUT` | `/:id` | Editar parking | ✅ Manager | `{ name, hourlyRate, status }` | `Parking` actualizado |
| `DELETE` | `/:id` | Eliminar parking | ✅ Manager | Param: `id` | `{ success: true }` |

---

## 🚗 Espacios (`/spaces`)
Controlador: `SpaceController`

| Método | Ruta | Descripción | Auth / Rol | Body / Query | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Crear lote espacios | ✅ Manager | `{ parkingId, spaces: [{ spaceNumber }] }` | `{ count: N }` |
| `PUT` | `/:id` | Actualizar estado | ✅ Manager | `{ status: "AVAILABLE" \| "OCCUPIED" }` | `ParkingSpace` actualizado |
| `DELETE` | `/:id` | Eliminar espacio | ✅ Manager | Param: `id` | `{ success: true }` |
| `GET` | `/:id` | Ver estado | ❌ Público | Param: `id` | `ParkingSpace` |

---

## 📅 Reservas (`/reservations`)
Controlador: `ReservationController`

| Método | Ruta | Descripción | Auth / Rol | Body / Query | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Crear reserva | ✅ Driver | `{ parkingId, spaceId, startTime, estimatedHours }` | `Reservation` (Status: PENDING) |
| `GET` | `/` | Listar (Filtros) | ✅ Driver | Query: `?status=...&startDate=...` | `[ Reservation, ... ]` |
| `GET` | `/my-history` | Historial completo | ✅ Driver | - | `[ Reservation, ... ]` |
| `GET` | `/:id` | Ver detalle | ✅ Driver/Mgr | Param: `id` | `Reservation` detallada |
| `PUT` | `/:id` | Editar notas | ✅ Driver | `{ notes }` | `Reservation` actualizada |
| `POST` | `/:id/cancel`| Cancelar reserva | ✅ Driver | `{ cancellationReason }` | `{ status: "CANCELLED" }` |
| `POST` | `/:id/activate`| Entrar al parking | ✅ Manager | - | `{ status: "ACTIVE", startTime: Now }` |
| `POST` | `/:id/complete`| Salir (Cobrar) | ✅ Manager | - | `{ status: "COMPLETED", actualCost: N }` |

---

## 💰 Pagos (`/payments`)
Controlador: `PaymentController`

| Método | Ruta | Descripción | Auth / Rol | Body / Query | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/report` | Reportar pago | ✅ Driver | `{ reservationId, amount, method, referenceId }` | `Transaction` (Status: PENDING) |
| `PUT` | `/:id/verify` | Verificar pago | ✅ Manager | - | `Transaction` (Status: VERIFIED) |
| `GET` | `/pending` | Pagos pendientes | ✅ Manager | - | `[ Transaction, ... ]` |
| `GET` | `/my-history` | Mis pagos | ✅ Driver | - | `[ Transaction, ... ]` |
| `GET` | `/stats` | Finanzas básicas | ✅ Manager | - | `{ totalRevenue, pendingAmount }` |

---

## 💎 Lealtad (`/loyalty`)
Controlador: `LoyaltyController`

| Método | Ruta | Descripción | Auth / Rol | Body / Query | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/me` | Mi perfil puntos | ✅ Driver | - | `{ pointsBalance, tier, lifetimePoints }` |

---

## 📊 Analíticas (`/analytics`)
Controlador: `AnalyticsController`

| Método | Ruta | Descripción | Auth / Rol | Body / Query | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | KPIs Generales | ✅ Manager | Query: `?parkingId=...` | `{ revenue, occupancyRate, activeReservations }` |
| `GET` | `/revenue` | Gráfica Ingresos | ✅ Manager | Query: `?parkingId=...` | `[ { date, amount }, ... ]` |
| `GET` | `/occupancy` | Mapa Calor | ✅ Manager | Query: `?parkingId=...` | `[ { date, count }, ... ]` |
| `GET` | `/top-users` | Top Clientes | ✅ Manager | - | `[ { user, visits }, ... ]` |
| `GET` | `/export` | Exportar CSV | ✅ Manager | Query: `?parkingId=...` | Archivo `.csv` |