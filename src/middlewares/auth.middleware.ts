import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt.util';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    const payload = verifyToken(token);

    request.user = payload;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
}