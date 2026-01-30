import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.util';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken } from '../utils/jwt.util';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { env } from '../config/env';
import { encryptionUtil } from '../utils/encryption.util';

export class AuthService {
  
  // Helper privado para generar el par de tokens
  private generateTokens(user: { id: string; email: string; role: string }) {
    // 1. Access Token (Corto plazo - 15m)
    const accessToken = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
    });

    // 2. Refresh Token (Largo plazo - 7d)
    const refreshToken = generateRefreshToken({ 
        userId: user.id 
    });

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

  // A. Configurar 2FA (Generar secreto y QR)
  async setupTwoFactor(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    // 1. Generar secreto (Speakeasy lo hace todo junto)
    const secret = speakeasy.generateSecret({
      name: `Parking App (${user.email})` // El nombre que sale en la App del usuario
    });
    
    // 2. Generar Imagen QR
    // secret.otpauth_url ya viene listo, solo lo convertimos a imagen
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    const encryptedSecret = encryptionUtil.encrypt(secret.base32); // Encriptamos

    // 3. Guardar secreto en BD
    // IMPORTANTE: Guardamos lo encriptado. 'base32' que es el formato estándar
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptedSecret } 
    });

    return { secret: secret.base32, qrCodeUrl }; // Al usuario le mostramos el original
  }

  // B. Confirmar y Activar 2FA
  async enableTwoFactor(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new Error('Configuración de 2FA no iniciada');

    // Desencriptamos lo que viene de la BD antes de verificar
    let decryptedSecret;
    try {
        decryptedSecret = encryptionUtil.decrypt(user.twoFactorSecret);
    } catch (e) {
        throw new Error('Error de seguridad: Secreto inválido');
    }

    // Verificar token usando speakeasy
    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret, // Usamos la versión plana
      encoding: 'base32',
      token: token,
      window: 1 // Permite un margen de error de +/- 30 segundos por si el reloj está desfasado
    });

    if (!isValid) throw new Error('Código 2FA inválido');

    // Activar oficialmente
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return true;
  }

  // Login con Bloqueo y soporte de 2FA
  async login(data: LoginInput & { twoFactorCode?: string }) { // Agregamos code opcional
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user) throw new Error('Credenciales inválidas');

    // 1. CHEQUEO DE BLOQUEO
    if (user.failedAttempts >= 3) {
      throw new Error('Cuenta bloqueada por múltiples intentos fallidos. Por favor restablece tu contraseña para desbloquearla.');
    }

    // 2. VERIFICAR CONTRASEÑA
    const isValidPassword = await comparePassword(data.password, user.password);

    if (!isValidPassword) {
      // INCREMENTAR CONTADOR DE FALLOS
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: { increment: 1 } }
      });
      
      const intentosRestantes = 2 - user.failedAttempts;
      if (intentosRestantes < 0) {
          throw new Error('Cuenta bloqueada. Restablece tu contraseña.');
      }
      throw new Error(`Credenciales inválidas. Te quedan ${intentosRestantes + 1} intentos.`);
    }

    // 3. SI LA CONTRASEÑA ES CORRECTA, RESETEAR CONTADOR
    if (user.failedAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0 }
      });
    }

    // ... validaciones de estado (PENDING/ACTIVE) ...
    if (user.status === 'PENDING') throw new Error('Debes verificar tu correo.');
    if (user.status !== 'ACTIVE') throw new Error('Usuario inactivo.');

    // --- LÓGICA 2FA ---
    if (user.twoFactorEnabled) {
      if (!data.twoFactorCode) {
        throw new Error('Código 2FA requerido'); 
      }

      // Desencriptar el secreto almacenado
      let decryptedSecret;
      try {
          decryptedSecret = encryptionUtil.decrypt(user.twoFactorSecret!);
      } catch (e) {
          // Si falla al desencriptar, es un error crítico de datos
          throw new Error('Error interno de autenticación (Credencial corrupta)');
      }

      // Validar código con speakeasy
      const isValid = speakeasy.totp.verify({ 
        secret: decryptedSecret,
        encoding: 'base32',
        token: data.twoFactorCode,
        window: 1
      });

      if (!isValid) throw new Error('Código 2FA incorrecto');
    }
    
    // Generar tokens
    const tokens = this.generateTokens(user);
    const { password: _, twoFactorSecret: __, ...userClean } = user; // Quitamos secretos
    return { user: userClean, ...tokens };
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

  // Desbloquear al resetear contraseña
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) throw new Error('Token inválido o expirado');

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        failedAttempts: 0 // <--- AQUÍ DESBLOQUEAMOS AL USUARIO
      }
    });

    return true;
  }
}