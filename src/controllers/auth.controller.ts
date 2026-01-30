import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';
import { emailService } from '../services/email.service';
import { auditService } from '../services/audit.service';

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
    const { email } = request.body as any; // Capturamos email para el log aunque falle
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];
    try {
      const validatedData = loginSchema.parse(request.body);
      const result = await authService.login(validatedData);

      // Determinamos el método usado
      const loginMethod = result.user.twoFactorEnabled ? '2fa' : 'password_only';

      // ✅ AUDITORÍA: LOGIN EXITOSO
      await auditService.log({
        userId: result.user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'USER',
        resourceId: result.user.id,
        ipAddress: ip,
        userAgent: userAgent,
        // Guardamos el detalle
        details: { 
          method: loginMethod,
          twoFactorEnabled: result.user.twoFactorEnabled 
        }
      });

      return reply.code(200).send({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error) {

      // ❌ AUDITORÍA: LOGIN FALLIDO
      // (Solo logueamos si sabemos el email, para no llenar la BD de basura anónima)
      if (email) {
        // Intentamos buscar el ID del usuario si existe, para vincularlo
        // (Esto es opcional, pero ayuda a rastrear ataques a cuentas específicas)
        // Por simplicidad, aquí solo guardamos el email en details
         await auditService.log({
          action: 'LOGIN_FAILED',
          resource: 'USER',
          details: { email, error: (error as Error).message },
          ipAddress: ip,
          userAgent: userAgent,
        });
      }

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

  // Solicitar Reset
  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email } = request.body as { email: string };
      if (!email) return reply.code(400).send({ success: false, message: 'Email requerido' });

      const result = await authService.requestPasswordReset(email);

      // Si el usuario existe, enviamos el correo
      if (result) {
        try {
          console.log(`📨 Enviando token de recuperación a ${result.user.email}...`);
          await emailService.sendPasswordResetEmail(result.user.email, result.user.firstName, result.resetToken);
        } catch (error) {
          console.error('Error enviando email reset:', error);
        }
      }

      // Siempre respondemos OK por seguridad (para no confirmar si el email existe o no)
      return reply.send({
        success: true,
        message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña.'
      });

    } catch (error: any) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  }

  // Cambiar Contraseña
  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token, newPassword } = request.body as { token: string; newPassword: string };

      if (!token || !newPassword) {
        return reply.code(400).send({ success: false, message: 'Token y nueva contraseña requeridos' });
      }

      if (newPassword.length < 6) {
        return reply.code(400).send({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
      }

      await authService.resetPassword(token, newPassword);

      return reply.send({
        success: true,
        message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión.'
      });

    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  }

  // Setup 2FA
  async setupTwoFactor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.userId; // Viene del JWT
      const result = await authService.setupTwoFactor(userId);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  }

  // Enable 2FA
  async enableTwoFactor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.body as { token: string };
      const userId = request.user.userId;
      
      await authService.enableTwoFactor(userId, token);
      
      return reply.send({ success: true, message: '2FA activado exitosamente' });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
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