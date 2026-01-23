import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';
import { emailService } from '../services/email.service';

const authService = new AuthService();

export class AuthController {
  
  // Register (Ahora envía email de verificación)
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = registerSchema.parse(request.body);
      
      // Creamos el usuario (estado PENDING)
      const user = await authService.register(validatedData);

      // Enviamos el correo con el token generado
      try {
        // user.verificationToken viene del servicio ahora
        if (user.email && user.verificationToken) { 
          console.log(`📨 Enviando verificación a ${user.email}...`);
          await emailService.sendVerificationEmail(user.email, user.firstName, user.verificationToken);
        }
      } catch (emailError) {
        console.error("⚠️ Error enviando email de verificación:", emailError);
      }

      return reply.code(201).send({
        success: true,
        message: 'Usuario registrado. Por favor verifica tu email para activar la cuenta.',
        // No devolvemos tokens ni data sensible
      });

    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = loginSchema.parse(request.body);
      const result = await authService.login(validatedData);

      return reply.code(200).send({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error) {
      // Manejo específico para login (401) si es error genérico
      if (error instanceof Error && error.message === 'Credenciales inválidas') {
         return reply.code(401).send({ success: false, message: error.message });
      }
      return this.handleError(error, reply);
    }
  }

  // Endpoint Verify
  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.query as { token: string };

      if (!token) {
        return reply.code(400).send({ success: false, message: 'Token requerido' });
      }

      await authService.verifyEmail(token);

      return reply.send({
        success: true,
        message: '¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.'
      });
      
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      
      if (!refreshToken) {
        return reply.code(400).send({ success: false, message: 'Refresh token requerido' });
      }

      const tokens = await authService.refreshToken(refreshToken);

      return reply.send({
        success: true,
        message: 'Token refrescado exitosamente',
        data: tokens
      });

    } catch (error: any) {
      return reply.code(401).send({ success: false, message: error.message });
    }
  }

  // Helper privado para no repetir lógica de errores
  private handleError(error: unknown, reply: FastifyReply) {
    console.error('Auth Error:', error);

    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.code(400).send({ success: false, message: 'Error de validación', errors: formattedErrors });
    }

    if (error instanceof Error) {
      return reply.code(400).send({ success: false, message: error.message });
    }

    return reply.code(500).send({ success: false, message: 'Error interno del servidor' });
  }
}