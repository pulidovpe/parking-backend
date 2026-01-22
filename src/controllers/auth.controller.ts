import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';
import { emailService } from '../services/email.service';

const authService = new AuthService();

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar datos
      const validatedData = registerSchema.parse(request.body);

      // Registrar usuario
      const result = await authService.register(validatedData);

      // --- 📧 ENVIAR EMAIL DE BIENVENIDA ---
      // Usamos try/catch para que si falla el email, NO falle el registro del usuario
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
      // Log del error para debug
      console.error('Error en register:', error);

      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return reply.code(400).send({
          success: false,
          message: 'Error de validación',
          errors: formattedErrors,
        });
      }

      if (error instanceof Error) {
        return reply.code(400).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar datos
      const validatedData = loginSchema.parse(request.body);

      // Login
      const result = await authService.login(validatedData);

      return reply.code(200).send({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error) {
      // Log del error para debug
      console.error('Error en login:', error);

      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return reply.code(400).send({
          success: false,
          message: 'Error de validación',
          errors: formattedErrors,
        });
      }

      if (error instanceof Error) {
        return reply.code(401).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}