import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.util';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';
import jwt from 'jsonwebtoken'; // <--- Usamos librería estándar
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
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(data.password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      },
      select: { // Select limpio para devolver
        id: true, email: true, firstName: true, lastName: true, 
        phone: true, role: true, status: true, points: true, createdAt: true,
      },
    });

    // Generar AMBOS tokens
    const tokens = this.generateTokens(user);

    return { user, ...tokens }; // Devuelve user, accessToken y refreshToken
  }

  async login(data: LoginInput) {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isValidPassword = await comparePassword(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (user.status !== 'ACTIVE') {
      throw new Error('Usuario inactivo o suspendido');
    }

    // Generar AMBOS tokens
    const tokens = this.generateTokens(user);

    // Retornar usuario sin password + tokens
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  // NUEVO MÉTODO: Refrescar Token
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
}