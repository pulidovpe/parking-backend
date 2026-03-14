import { WebSocket } from '@fastify/websocket';

// Mapa de conexiones activas
// Clave: userId  →  Valor: Set de conexiones (un usuario puede tener varias pestañas/dispositivos)
const userConnections = new Map<string, Set<WebSocket>>();

// Mapa de rooms por parkingId (para el mapa de disponibilidad en vivo)
// Clave: parkingId  →  Valor: Set de conexiones suscritas
const parkingRooms = new Map<string, Set<WebSocket>>();

export const wsRoomManager = {

  // --- Gestión de conexiones de usuario ---

  addUser(userId: string, socket: WebSocket): void {
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socket);
    console.log(`🔌 WS: Usuario ${userId} conectado. Conexiones activas: ${this.getTotalConnections()}`);
  },

  removeUser(userId: string, socket: WebSocket): void {
    const sockets = userConnections.get(userId);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        userConnections.delete(userId);
      }
    }
    // Limpiar también de los rooms de parking
    parkingRooms.forEach((sockets, parkingId) => {
      sockets.delete(socket);
      if (sockets.size === 0) {
        parkingRooms.delete(parkingId);
      }
    });
    console.log(`🔌 WS: Usuario ${userId} desconectado. Conexiones activas: ${this.getTotalConnections()}`);
  },

  // Enviar mensaje a un usuario específico (todas sus conexiones)
  sendToUser(userId: string, message: string): void {
    const sockets = userConnections.get(userId);
    if (!sockets || sockets.size === 0) return;

    sockets.forEach((socket) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(message);
      }
    });
  },

  // --- Gestión de rooms por parking ---

  joinParkingRoom(parkingId: string, socket: WebSocket): void {
    if (!parkingRooms.has(parkingId)) {
      parkingRooms.set(parkingId, new Set());
    }
    parkingRooms.get(parkingId)!.add(socket);
    console.log(`🏠 WS: Socket unido al room del parking ${parkingId}`);
  },

  // Broadcast a todos los que están viendo un parking
  broadcastToParkingRoom(parkingId: string, message: string): void {
    const sockets = parkingRooms.get(parkingId);
    if (!sockets || sockets.size === 0) return;

    sockets.forEach((socket) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(message);
      }
    });
  },

  // --- Utilidades ---

  getTotalConnections(): number {
    let total = 0;
    userConnections.forEach((sockets) => (total += sockets.size));
    return total;
  },
};