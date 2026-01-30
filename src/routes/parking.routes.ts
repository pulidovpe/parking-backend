import type { FastifyInstance } from 'fastify';
import { ParkingController } from '../controllers/parking.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const parkingController = new ParkingController();

export async function parkingRoutes(app: FastifyInstance) {
  // Rutas públicas
  app.get('/search', parkingController.searchNearby.bind(parkingController));
  app.get('/:id', parkingController.findById.bind(parkingController));

  // Rutas protegidas
  app.get('/', { preHandler: authMiddleware }, parkingController.findAll.bind(parkingController));
  app.post('/', { preHandler: authMiddleware }, parkingController.create.bind(parkingController));
  //app.put('/:id', { preHandler: authMiddleware }, parkingController.update.bind(parkingController));
  //app.delete('/:id', { preHandler: authMiddleware }, parkingController.delete.bind(parkingController));
  app.put('/:id', { preHandler: authMiddleware }, (req: any, reply) => parkingController.update(req, reply));
  app.delete('/:id', { preHandler: authMiddleware }, (req: any, reply) => parkingController.delete(req, reply));
}