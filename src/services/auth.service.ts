import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.util';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export class AuthService {
  
  // Helper privado para generar el par de tokens
  private generateTokens(user: { id: string; email: string; role: string }) {
    // 1. Access Token (Corto plazo - 15m)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    // 2. Refresh Token (Largo plazo - 7d)
    const refreshToken = jwt.sign(
      { userId: user.id }, // Payload mínimo
      env.jwt.refreshSecret,
      { expiresIn: env.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error('El email ya está registrado');

    const hashedPassword = await hashPassword(data.password);
    
    // Generar token aleatorio de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        status: 'PENDING', // <--- Nace INACTIVO
        verificationToken: verificationToken, // <--- Guardamos el token
      },
      select: { id: true, email: true, firstName: true, verificationToken: true } // Solo devolvemos lo necesario
    });

    // NO devolvemos tokens JWT aquí. El usuario debe verificar primero.
    return user; 
  }

  // Método para verificar cuenta
  async verifyEmail(token: string) {
    // Buscar usuario con ese token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) throw new Error('Token de verificación inválido');

    // Activar usuario y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        verificationToken: null
      }
    });

    return true;
  }

  // Login (Bloquear PENDING)
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Credenciales inválidas');

    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) throw new Error('Credenciales inválidas');

    // VALIDACIÓN IMPORTANTE
    if (user.status === 'PENDING') {
      throw new Error('Debes verificar tu correo electrónico antes de iniciar sesión.');
    }
    
    if (user.status !== 'ACTIVE') {
      throw new Error('Usuario inactivo o suspendido');
    }

    const tokens = this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  // Refrescar Token
  async refreshToken(token: string) {
    try {
      // 1. Verificar firma del Refresh Token usando el SECRETO DE REFRESCO
      const decoded = jwt.verify(token, env.jwt.refreshSecret) as any;

      // 2. Buscar si el usuario aún existe en BD
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw new Error('Usuario no encontrado');
      
      if (user.status !== 'ACTIVE') throw new Error('Usuario suspendido');

      // 3. Generar NUEVOS tokens (Rotación)
      return this.generateTokens(user);

    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }

  // Solicitar recuperación
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Por seguridad, si el usuario no existe, NO lanzamos error para no revelar correos registrados.
    // Solo retornamos false silenciosamente o enviamos un email genérico.
    if (!user) return null; 

    // Ahora: 4 bytes = 8 caracteres hexadecimales
    const resetToken = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Ahora: 20 minutos (1200000 ms) para compensar la menor longitud
    const resetTokenExpiry = new Date(Date.now() + 20 * 60000);

    // Guardar en BD
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    return { user, resetToken };
  }

  // Ejecutar el cambio de contraseña
  async resetPassword(token: string, newPassword: string) {
    // Buscar usuario con ese token y que NO haya expirado
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() } // Expiry > Ahora
      }
    });

    if (!user) throw new Error('Token inválido o expirado');

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar usuario y limpiar el token usado
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return true;
  }
}