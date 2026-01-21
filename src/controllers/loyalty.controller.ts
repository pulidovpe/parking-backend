import { FastifyReply, FastifyRequest } from 'fastify';
import { loyaltyService } from '../services/loyalty.service';

export const loyaltyController = {
  async getMyProfile(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const userId = user.id || user.userId || user.sub;

      const profile = await loyaltyService.getProfile(userId);
      return reply.send(profile);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
};