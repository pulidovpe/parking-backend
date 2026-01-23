import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';
import { emailService } from '../services/email.service';

const authService = new AuthService();

export class AuthController {
  
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = registerSchema.parse(request.body);
      const result = await authService.register(validatedData);

      // Email de bienvenida
      try {
        if (result.user && result.user.email) {
          console.log(`📨 Intentando enviar email a ${result.user.email}...`);
          await emailService.sendWelcomeEmail(result.user.email, result.user.firstName);
        }
      } catch (emailError) {
        console.error("⚠️ Error enviando email de bienvenida:", emailError);
      }

      return reply.code(201).send({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
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