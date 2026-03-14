import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import { wsRoomManager } from './ws.room-manager';
import { WsEventType, buildWsMessage } from './ws.events';
import { cacheService } from '../services/cache.service';

const HEARTBEAT_INTERVAL_MS = 30_000;

// Extendemos el tipo de WebSocket para marcar si está vivo
interface AliveSocket extends WebSocket {
  isAlive: boolean;
}

// Rate limiting simple por IP para el handshake WS
// Clave: IP → número de conexiones activas
const connectionsByIp = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 5;

export async function wsGateway(app: FastifyInstance): Promise<void> {

  await app.register(websocket);

  // Intervalo global de heartbeat — usa ping nativo del protocolo WS
  // wscat y cualquier cliente WS estándar responden automáticamente con pong
  let heartbeatInterval: ReturnType<typeof setInterval>;

  app.get('/ws', { websocket: true }, (socket, request) => {
    const ws = socket as unknown as AliveSocket;

    // Ejecutar la lógica async en un IIFE para poder usar await
    (async () => {

      // --- Rate limit por IP ---
      const clientIp = request.ip;
      const currentCount = connectionsByIp.get(clientIp) ?? 0;

      if (currentCount >= MAX_CONNECTIONS_PER_IP) {
        ws.send(buildWsMessage(WsEventType.ERROR, { message: 'Demasiadas conexiones desde tu IP' }));
        ws.close(1008, 'Rate limit excedido');
        return;
      }
      connectionsByIp.set(clientIp, currentCount + 1);

      // --- Autenticación en el handshake ---
      const { token } = request.query as { token?: string };

      if (!token) {
        connectionsByIp.set(clientIp, (connectionsByIp.get(clientIp) ?? 1) - 1);
        ws.send(buildWsMessage(WsEventType.ERROR, { message: 'Token requerido' }));
        ws.close(1008, 'Token requerido');
        return;
      }

      let userId: string;

      try {
        // 1. Verificar firma criptográfica del JWT
        const decoded = app.jwt.verify<{ userId: string }>(token);
        userId = decoded.userId;

        // 2. Verificar blacklist (tokens revocados por logout)
        const isBlacklisted = await cacheService.get<string>(`blacklist:${token}`);
        if (isBlacklisted) {
          connectionsByIp.set(clientIp, (connectionsByIp.get(clientIp) ?? 1) - 1);
          ws.send(buildWsMessage(WsEventType.ERROR, { message: 'Sesión cerrada. Reconecta con un token válido.' }));
          ws.close(1008, 'Token revocado');
          return;
        }
      } catch {
        connectionsByIp.set(clientIp, (connectionsByIp.get(clientIp) ?? 1) - 1);
        ws.send(buildWsMessage(WsEventType.ERROR, { message: 'Token inválido o expirado' }));
        ws.close(1008, 'Token inválido');
        return;
      }

      // Marcar como vivo al conectar
      ws.isAlive = true;

      // Responde al pong nativo del protocolo WS
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Registrar conexión en el room manager
      wsRoomManager.addUser(userId, ws);

      // --- Mensajes entrantes del cliente ---
      ws.on('message', (rawMessage: Buffer) => {
        try {
          const msg = JSON.parse(rawMessage.toString());

          // Unirse al room de un parking para recibir disponibilidad en vivo
          // Formato: { "event": "join_parking_room", "data": { "parkingId": "uuid" } }
          if (msg.event === 'join_parking_room' && msg.data?.parkingId) {
            wsRoomManager.joinParkingRoom(msg.data.parkingId, ws);
            ws.send(buildWsMessage(WsEventType.PING, { joined: msg.data.parkingId }));
          }

        } catch {
          // Mensaje malformado — ignorar
        }
      });

      // --- Limpieza al desconectar (único handler consolidado) ---
      ws.on('close', () => {
        const count = connectionsByIp.get(clientIp) ?? 1;
        count <= 1
          ? connectionsByIp.delete(clientIp)
          : connectionsByIp.set(clientIp, count - 1);
        wsRoomManager.removeUser(userId, ws);
      });

      ws.on('error', (err: Error) => {
        console.error(`❌ WS Error (userId: ${userId}):`, err.message);
        wsRoomManager.removeUser(userId, ws);
      });

    })().catch((err) => {
      console.error('❌ WS handler error:', err);
      ws.close(1011, 'Error interno');
    });
  });

  // Iniciar el heartbeat global una sola vez, después de registrar la ruta
  app.ready(() => {
    heartbeatInterval = setInterval(() => {
      // Iteramos el servidor WS directamente para hacer ping nativo
      // @ts-ignore — accedemos al servidor ws interno del plugin
      const wsServer = app.websocketServer;
      if (!wsServer) return;

      wsServer.clients.forEach((client: WebSocket) => {
        const ws = client as AliveSocket;

        if (!ws.isAlive) {
          // No respondió al ping anterior → terminar
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping(); // Ping nativo del protocolo WebSocket (no JSON)
      });
    }, HEARTBEAT_INTERVAL_MS);
  });

  // Limpiar el intervalo al cerrar la app
  app.addHook('onClose', () => {
    clearInterval(heartbeatInterval);
  });
}
