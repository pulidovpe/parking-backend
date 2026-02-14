# Documentación de Endpoints - Parking Backend

**Estado Actual:**
✅ [OK] = Implementado en código
❌ [FALTA] = Pendiente de implementar (Ver Roadmap)

**URL Base:** `/api`
**Autenticación:** Bearer Token (JWT)

## 🔐 Autenticación (AuthRoutes)

| Estado | Método | Endpoint | Descripción | Datos (Body) | Resp. Exitosa | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| ✅ | `POST` | `/auth/register` | Registrar usuario | `{ email, password, firstName... }` | `{ user, tokens }` | No |
| ✅ | `POST` | `/auth/login` | Login (Soporta 2FA) | `{ email, password }` | `{ user, tokens }` | No |
| ✅ | `POST` | `/auth/refresh` | Refrescar token | `{ refreshToken }` | `{ accessToken }` | No |
| ✅ | `GET` | `/auth/verify` | Verificar Email | Query: `?token=...` | `{ success: true }` | No |
| ✅ | `GET` | `/auth/profile` | Perfil usuario | - | `{ user }` | Sí |
| ✅ | `POST` | `/auth/forgot-password`| Pedir reset pass | `{ email }` | `{ success: true }` | No |
| ✅ | `POST` | `/auth/reset-password` | Cambiar pass | `{ token, newPassword }` | `{ success: true }` | No |
| ❌ | `POST` | `/auth/logout` | Cerrar sesión | - | `{ success: true }` | Sí |

## 🛡️ 2FA (AuthRoutes)

| Estado | Método | Endpoint | Descripción | Datos (Body) | Resp. Exitosa | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| ✅ | `POST` | `/auth/2fa/setup` | Generar secreto/QR | - | `{ qrCode, secret }`| Sí |
| ✅ | `POST` | `/auth/2fa/enable` | Activar tras escanear| `{ token }` | `{ enabled: true }` | Sí |
| ❌ | `POST` | `/auth/2fa/disable` | Desactivar 2FA | `{ token, password }`| `{ enabled: false }`| Sí |
| ❌ | `POST` | `/auth/2fa/authenticate`| Validar solo código | `{ email, token }` | `{ tokens }` | No |

## 🅿️ Estacionamientos (ParkingRoutes)

| Estado | Método | Endpoint | Descripción | Datos (Body) | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ✅ | `POST` | `/parkings` | Crear parking | `{ name, lat, lng... }` | Manager |
| ✅ | `GET` | `/parkings` | Listar propios | - | Manager |
| ✅ | `GET` | `/parkings/search` | Buscar cercanos | Query: `lat, lng, radius` | Todos |
| ✅ | `GET` | `/parkings/:id` | Ver detalle | - | Todos |
| ✅ | `PATCH` | `/parkings/:id` | Editar | `{ name, status... }` | Manager |
| ✅ | `DELETE` | `/parkings/:id` | Eliminar | - | Manager |

## 🚗 Espacios (SpaceRoutes)

| Estado | Método | Endpoint | Descripción | Datos (Body) | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ✅ | `POST` | `/spaces` | Crear espacios | `{ parkingId, quantity... }`| Manager |
| ✅ | `GET` | `/spaces/:id` | Ver espacio | - | Todos |
| ✅ | `PATCH` | `/spaces/:id` | Actualizar estado | `{ status }` | Manager |
| ✅ | `DELETE` | `/spaces/:id` | Eliminar | - | Manager |

## 📅 Reservas (ReservationRoutes)

| Estado | Método | Endpoint | Descripción | Datos (Body) | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ✅ | `POST` | `/reservations` | Crear reserva | `{ spaceId, startTime... }` | Driver |
| ✅ | `GET` | `/reservations` | Mis reservas | - | Driver |
| ✅ | `PATCH` | `/reservations/:id/cancel`| Cancelar | `{ reason }` | Driver |