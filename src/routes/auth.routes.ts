import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', authController.register.bind(authController));
  app.post('/login', authController.login.bind(authController));
  
  // RUTA DE REFRESCO
  app.post('/refresh', authController.refresh.bind(authController));

  // RUTA GET (El link del correo apunta aquí)
  app.get('/verify', authController.verifyEmail.bind(authController));

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

  // RUTAS DE RECUPERACIÓN
  app.post('/forgot-password', authController.forgotPassword.bind(authController));
  app.post('/reset-password', authController.resetPassword.bind(authController));
}