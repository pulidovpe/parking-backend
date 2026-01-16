import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';

const authService = new AuthService();

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar datos
      const validatedData = registerSchema.parse(request.body);

      // Registrar usuario
      const result = await authService.register(validatedData);

      return reply.code(201).send({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Error de validación',
          errors: error.errors,
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
      if (error instanceof ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Error de validación',
          errors: error.errors,
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