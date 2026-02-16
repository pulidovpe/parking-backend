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
import { cacheService } from './cache.service';

export class AuthService {
  
  // Helper privado para generar el par de tokens
  private generateTokens(user: { id: string; email: string; role: string }) {
    // 1. Access Token (Corto plazo - 2h)
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

  // [NUEVO] LOGOUT SEGURO
  async logout(token: string) {
    try {
      // 1. Decodificar el token sin verificar firma (ya pasó middleware) para ver expiración
      const decoded: any = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        // Si no se puede leer, igual retornamos éxito por seguridad
        return true; 
      }

      // 2. Calcular tiempo restante de vida (TTL)
      const expirationTime = decoded.exp * 1000; // a ms
      const currentTime = Date.now();
      const ttl = Math.floor((expirationTime - currentTime) / 1000); // a segundos

      if (ttl > 0) {
        // 3. Agregar a Lista Negra en Redis
        // Clave: blacklist:<token>, Valor: 'true', Expiración: ttl
        await cacheService.set(`blacklist:${token}`, 'true', ttl);
      }

      return true;
    } catch (error) {
      console.error('Error en logout:', error);
      // No lanzamos error al usuario, el logout debe ser "best effort"
      return true;
    }
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
      window: 6 // <-- ACTUALIZADO: Aumentamos la ventana aquí también por si acaso
    });

    if (!isValid) throw new Error('Código 2FA inválido');

    // Activar oficialmente
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return true;
  }

  // C. Desactivar 2FA (CON DEBUGGING Y MAYOR TOLERANCIA)
  async disableTwoFactor(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');
    if (!user.twoFactorEnabled) throw new Error('2FA no está activo');

    // Validamos el código antes de desactivar por seguridad
    if (user.twoFactorSecret) {
      let decryptedSecret;
      try {
          decryptedSecret = encryptionUtil.decrypt(user.twoFactorSecret);
      } catch (e) {
          console.error("Error desencriptando secreto 2FA:", e);
          throw new Error('Error de seguridad: Secreto corrupto');
      }

      const expectedToken = speakeasy.totp({
        secret: decryptedSecret,
        encoding: 'base32'
      });
      console.log(`🔐 DEBUG 2FA DISABLE:`);
      console.log(`   - Usuario ID: ${userId}`);
      console.log(`   - Código Recibido: ${token}`);
      console.log(`   - Código Esperado (Server Time): ${expectedToken}`);
      console.log(`   - Server Time: ${new Date().toISOString()}`);

      const isValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: token,
        window: 6 // <-- Aumentado a 6
      });

      if (!isValid) {
        console.error(`❌ Fallo validación 2FA. Recibido: ${token} vs Esperado: ${expectedToken}`);
        throw new Error('Código 2FA inválido. No se puede desactivar.');
      }
    }

    // Desactivar y limpiar secreto
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null 
      }
    });

    console.log(`✅ 2FA Desactivado correctamente para usuario ${userId}`);
    return true;
  }

  // Login con Bloqueo y soporte de 2FA (MEJORADO CON HORA)
  async login(data: LoginInput & { twoFactorCode?: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user) throw new Error('Credenciales inválidas');

    // 1. CHEQUEO DE BLOQUEO
    if (user.failedAttempts >= 3) {
      throw new Error('Cuenta bloqueada por múltiples intentos fallidos. Por favor restablece tu contraseña para desbloquearla.');
    }

    // 2. VERIFICAR CONTRASEÑA
    const isValidPassword = await comparePassword(data.password, user.password);

    if (!isValidPassword) {
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

    if (user.status === 'PENDING') throw new Error('Debes verificar tu correo.');
    if (user.status !== 'ACTIVE') throw new Error('Usuario inactivo.');

    // --- LÓGICA 2FA ---
    if (user.twoFactorEnabled) {
      if (!data.twoFactorCode) {
        throw new Error('Código 2FA requerido'); 
      }

      let decryptedSecret;
      try {
          decryptedSecret = encryptionUtil.decrypt(user.twoFactorSecret!);
      } catch (e) {
          throw new Error('Error interno de autenticación (Credencial corrupta)');
      }

      // --- DEBUG LOGS LOGIN ---
      const expectedToken = speakeasy.totp({
        secret: decryptedSecret,
        encoding: 'base32'
      });
      console.log(`🔑 DEBUG 2FA LOGIN:`);
      console.log(`   - Usuario: ${user.email}`);
      console.log(`   - Código Recibido: ${data.twoFactorCode}`);
      console.log(`   - Código Esperado: ${expectedToken}`);
      console.log(`   - Server Time: ${new Date().toISOString()}`); // <--- AÑADIDO PARA DIAGNÓSTICO
      // ------------------------

      const isValid = speakeasy.totp.verify({ 
        secret: decryptedSecret,
        encoding: 'base32',
        token: data.twoFactorCode,
        window: 6 // Margen de ±3 minutos
      });

      if (!isValid) throw new Error('Código 2FA incorrecto');
    }
    
    const tokens = this.generateTokens(user);
    const { password: _, twoFactorSecret: __, ...userClean } = user;
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