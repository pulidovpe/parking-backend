import Redis from 'ioredis';
import { env } from '../config/env';
import { wsRoomManager } from '../websockets/ws.room-manager';
import {
  WsEventType,
  buildWsMessage,
  PaymentStatusPayload,
  ReservationStatusPayload,
  SpaceAvailabilityPayload,
  ReservationExpiringPayload,
} from '../websockets/ws.events';

// Cliente Redis dedicado para PUBLISH (diferente al de caché)
const publisher = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Cliente Redis dedicado para SUBSCRIBE
// ioredis requiere instancias separadas para pub y sub
const subscriber = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Canales Redis que escuchamos
const CHANNELS = {
  PAYMENT:     'ws:payment',
  RESERVATION: 'ws:reservation',
  SPACE:       'ws:space',
};

// Tipos internos para el bus de mensajes
interface BusMessage {
  targetUserId?: string;    // Para mensajes dirigidos a un usuario
  targetParkingId?: string; // Para broadcasts a un room de parking
  event: WsEventType;
  payload: unknown;
}

export const wsService = {

  // Inicializar el subscriber (llamar una vez al arrancar la app)
  async initialize(): Promise<void> {
    await subscriber.subscribe(
      CHANNELS.PAYMENT,
      CHANNELS.RESERVATION,
      CHANNELS.SPACE
    );

    subscriber.on('message', (channel: string, rawMessage: string) => {
      try {
        const busMsg: BusMessage = JSON.parse(rawMessage);
        const wsMsg = buildWsMessage(busMsg.event, busMsg.payload);

        if (busMsg.targetUserId) {
          wsRoomManager.sendToUser(busMsg.targetUserId, wsMsg);
        }

        if (busMsg.targetParkingId) {
          wsRoomManager.broadcastToParkingRoom(busMsg.targetParkingId, wsMsg);
        }
      } catch (err) {
        console.error('❌ WS Service: Error procesando mensaje de Redis:', err);
      }
    });

    console.log('✅ WS Service: Subscriber de Redis inicializado');
  },

  // --- Métodos de publicación por tipo de evento ---

  async notifyPaymentStatus(
    userId: string,
    payload: PaymentStatusPayload
  ): Promise<void> {
    const event = payload.status === 'VERIFIED'
      ? WsEventType.PAYMENT_VERIFIED
      : WsEventType.PAYMENT_REJECTED;

    const busMsg: BusMessage = { targetUserId: userId, event, payload };
    await publisher.publish(CHANNELS.PAYMENT, JSON.stringify(busMsg));
  },

  async notifyReservationStatus(
    userId: string,
    payload: ReservationStatusPayload
  ): Promise<void> {
    const busMsg: BusMessage = {
      targetUserId: userId,
      event: WsEventType.RESERVATION_STATUS_CHANGED,
      payload,
    };
    await publisher.publish(CHANNELS.RESERVATION, JSON.stringify(busMsg));
  },

  async notifySpaceAvailability(
    parkingId: string,
    payload: SpaceAvailabilityPayload
  ): Promise<void> {
    const busMsg: BusMessage = {
      targetParkingId: parkingId,
      event: WsEventType.SPACE_AVAILABILITY_UPDATED,
      payload,
    };
    await publisher.publish(CHANNELS.SPACE, JSON.stringify(busMsg));
  },

  async notifyReservationExpiring(
    userId: string,
    payload: ReservationExpiringPayload
  ): Promise<void> {
    const busMsg: BusMessage = {
      targetUserId: userId,
      event: WsEventType.RESERVATION_EXPIRING_SOON,
      payload,
    };
    await publisher.publish(CHANNELS.RESERVATION, JSON.stringify(busMsg));
  },
};