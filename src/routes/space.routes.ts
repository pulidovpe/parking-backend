import type { FastifyInstance } from 'fastify';
import { SpaceController } from '../controllers/space.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const spaceController = new SpaceController();

export async function spaceRoutes(app: FastifyInstance) {
  // Rutas públicas
  app.get('/availability/:parkingId', spaceController.getParkingAvailability.bind(spaceController));
  app.get('/:id', spaceController.getSpaceById.bind(spaceController));

  // Rutas protegidas
  app.get('/', { preHandler: authMiddleware }, spaceController.getSpaces.bind(spaceController));
  app.post('/', { preHandler: authMiddleware }, spaceController.createSpace.bind(spaceController));
  app.post('/bulk', { preHandler: authMiddleware }, spaceController.createMultipleSpaces.bind(spaceController));
  app.put('/bulk-status', { preHandler: authMiddleware }, spaceController.bulkUpdateStatus.bind(spaceController));
  app.put('/:id', { preHandler: authMiddleware }, spaceController.updateSpace.bind(spaceController));
  app.delete('/:id', { preHandler: authMiddleware }, spaceController.deleteSpace.bind(spaceController));
}