import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';
import { emailService } from '../services/email.service';
import { auditService } from '../services/audit.service';

// Instancia global (Patrón Singleton del archivo original)
const authService = new AuthService();

export class AuthController {
  
  // Register
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = registerSchema.parse(request.body);
      const user = await authService.register(validatedData);

      try {
        if (user.email && user.verificationToken) { 
          await emailService.sendVerificationEmail(user.email, user.firstName, user.verificationToken);
        }
      } catch (emailError) {
        console.error("⚠️ Error enviando email de verificación:", emailError);
      }

      return reply.code(201).send({
        success: true,
        message: 'Usuario registrado. Por favor verifica tu email para activar la cuenta.',
      });

    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  // Login
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as any;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];
    try {
      const validatedData = loginSchema.parse(request.body);
      
      // ✅ CORRECTO: Usamos authService sin 'this'
      const result = await authService.login(validatedData);

      const loginMethod = result.user.twoFactorEnabled ? '2fa' : 'password_only';

      await auditService.log({
        userId: result.user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'USER',
        resourceId: result.user.id,
        ipAddress: ip,
        userAgent: userAgent,
        details: { method: loginMethod, twoFactorEnabled: result.user.twoFactorEnabled }
      });

      return reply.code(200).send({
        success: true,
        message: 'Login exitoso',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      if (email) {
         await auditService.log({
          action: 'LOGIN_FAILED',
          resource: 'USER',
          details: { email, error: (error as Error).message },
          ipAddress: ip,
          userAgent: userAgent,
        });
      }

      if (error instanceof Error && error.message === 'Credenciales inválidas') {
         return reply.code(401).send({ success: false, message: error.message });
      }
      return this.handleError(error, reply);
    }
  }

  // Verify Email
  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.query as { token: string };
      if (!token) return reply.code(400).send({ success: false, message: 'Token requerido' });

      await authService.verifyEmail(token);

      return reply.send({ success: true, message: 'Cuenta verificada exitosamente' });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  }

  // Refresh Token
  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      if (!refreshToken) return reply.code(400).send({ success: false, message: 'Refresh token requerido' });

      const tokens = await authService.refreshToken(refreshToken);

      return reply.send({ success: true, message: 'Token refrescado', data: tokens });
    } catch (error: any) {
      return reply.code(401).send({ success: false, message: error.message });
    }
  }

  // Forgot Password
  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email } = request.body as { email: string };
      if (!email) return reply.code(400).send({ success: false, message: 'Email requerido' });

      const result = await authService.requestPasswordReset(email);

      if (result) {
        try {
          await emailService.sendPasswordResetEmail(result.user.email, result.user.firstName, result.resetToken);
        } catch (error) {
          console.error('Error enviando email reset:', error);
        }
      }

      return reply.send({ success: true, message: 'Instrucciones enviadas al correo.' });
    } catch (error: any) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  }

  // Reset Password
  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token, newPassword } = request.body as { token: string; newPassword: string };
      if (!token || !newPassword) return reply.code(400).send({ success: false, message: 'Datos incompletos' });

      await authService.resetPassword(token, newPassword);

      return reply.send({ success: true, message: 'Contraseña actualizada.' });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  }

  // Setup 2FA
  async setupTwoFactor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as any;
      const userId = user.userId || user.id; // Soporte para ambas estructuras de token
      const result = await authService.setupTwoFactor(userId);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  }

  // Enable 2FA
  async enableTwoFactor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.body as { token: string }; // El frontend suele mandar 'token' aquí
      const user = request.user as any;
      const userId = user.userId || user.id;
      
      await authService.enableTwoFactor(userId, token);
      
      return reply.send({ success: true, message: '2FA activado exitosamente' });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  }

  // Disable 2FA (CORREGIDO)
  async disableTwoFactor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      // console.log('📦 DEBUG BODY:', body); // Descomentar si necesitas depurar más

      // El frontend envía 'twoFactorCode' según tus logs. Aceptamos variantes.
      const token = body.code || body.token || body.twoFactorCode;

      if (!token) {
        return reply.code(400).send({ 
          success: false, 
          message: 'Código 2FA requerido' 
        });
      }

      const user = request.user as any;
      const userId = user.userId || user.id;

      // 🛑 CORRECCIÓN CRÍTICA AQUÍ: 
      // Antes decía: await this.authService.disableTwoFactor(...) -> Error
      // Ahora dice: await authService.disableTwoFactor(...) -> Correcto (Variable global)
      await authService.disableTwoFactor(userId, token);

      // Auditoría
      if (auditService) {
          await auditService.log({
            userId,
            action: '2FA_DISABLED',
            resource: 'USER',
            resourceId: userId,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            details: { method: 'token_verification' }
          });
      }

      return reply.send({ success: true, message: '2FA desactivado exitosamente' });
    } catch (error: any) {
      return this.handleError(error, reply);
    }
  }

  // [NUEVO] LOGOUT ENDPOINT
  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        await authService.logout(token);
      }
      
      // Opcional: Limpiar cookies si las usaras
      // reply.clearCookie('token');

      return reply.send({ success: true, message: 'Sesión cerrada correctamente' });
    } catch (error) {
      // Incluso si falla algo interno, al usuario le decimos que salió
      return reply.send({ success: true, message: 'Sesión cerrada' });
    }
  }

  // Helper de errores
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