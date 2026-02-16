import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  // Públicas
  app.post('/register', authController.register.bind(authController));
  app.post('/login', authController.login.bind(authController));
  app.post('/refresh', authController.refresh.bind(authController));
  app.get('/verify', authController.verifyEmail.bind(authController));
  // RUTAS DE RECUPERACIÓN DE CONTRASEÑA
  app.post('/forgot-password', authController.forgotPassword.bind(authController));
  app.post('/reset-password', authController.resetPassword.bind(authController));

  // Protegidas
  app.post('/logout', { preHandler: authMiddleware }, authController.logout.bind(authController));
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

  // 2FA
  app.post('/2fa/setup', { preHandler: authMiddleware }, authController.setupTwoFactor.bind(authController));
  app.post('/2fa/enable', { preHandler: authMiddleware }, authController.enableTwoFactor.bind(authController));
  app.post('/2fa/disable', { preHandler: authMiddleware }, authController.disableTwoFactor.bind(authController));
}