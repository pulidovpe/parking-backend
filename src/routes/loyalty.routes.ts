import { FastifyInstance } from 'fastify';
import { loyaltyController } from '../controllers/loyalty.controller';

export async function loyaltyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request) => {
    await request.jwtVerify();
  });

  // GET /api/loyalty/me
  fastify.get('/me', loyaltyController.getMyProfile);
}