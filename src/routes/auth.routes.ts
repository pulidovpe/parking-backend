import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', authController.register.bind(authController));
  app.post('/login', authController.login.bind(authController));

  // Ruta protegida de ejemplo
  app.get(
    '/profile',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        message: 'Perfil obtenido',
        data: {
          user: request.user,
        },
      });
    }
  );
}