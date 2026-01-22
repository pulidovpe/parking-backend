import type { FastifyInstance } from 'fastify';
import { ReservationController } from '../controllers/reservation.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const reservationController = new ReservationController();

export async function reservationRoutes(app: FastifyInstance) {
  // Todas las rutas requieren autenticación
  app.addHook('preHandler', authMiddleware);

  // CRUD de reservas
  app.get('/', reservationController.getReservations.bind(reservationController));
  // Ruta para el historial del usuario autenticado
  app.get('/my-history', reservationController.getMyHistory.bind(reservationController));
  
  app.get('/:id', reservationController.getReservationById.bind(reservationController));
  app.post('/', reservationController.createReservation.bind(reservationController));
  app.put('/:id', reservationController.updateReservation.bind(reservationController));

  // Acciones de estado
  app.post('/:id/activate', reservationController.activateReservation.bind(reservationController));
  app.post('/:id/complete', reservationController.completeReservation.bind(reservationController));
  app.post('/:id/cancel', reservationController.cancelReservation.bind(reservationController));
}