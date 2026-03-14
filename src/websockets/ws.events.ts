// Tipos de eventos que el backend puede emitir al frontend
export enum WsEventType {
  // Reservas
  RESERVATION_STATUS_CHANGED = 'reservation:status_changed',
  RESERVATION_EXPIRING_SOON  = 'reservation:expiring_soon',

  // Pagos
  PAYMENT_VERIFIED  = 'payment:verified',
  PAYMENT_REJECTED  = 'payment:rejected',

  // Disponibilidad (mapa en vivo)
  SPACE_AVAILABILITY_UPDATED = 'space:availability_updated',

  // Sistema
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
}

// Estructura base de todos los mensajes WS
export interface WsMessage<T = unknown> {
  event: WsEventType;
  data: T;
  timestamp: string;
}

// Payloads tipados por evento
export interface ReservationStatusPayload {
  reservationId: string;
  status: string;
  parkingName?: string;
}

export interface PaymentStatusPayload {
  transactionId: string;
  status: 'VERIFIED' | 'REJECTED';
  reservationId: string;
  amount?: number;
  currency?: string;
}

export interface SpaceAvailabilityPayload {
  parkingId: string;
  spaceId: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

export interface ReservationExpiringPayload {
  reservationId: string;
  parkingName: string;
  minutesLeft: number;
  estimatedEndTime: string;
}

// Helper para construir un mensaje WS correctamente tipado
export function buildWsMessage<T>(event: WsEventType, data: T): string {
  const message: WsMessage<T> = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(message);
}