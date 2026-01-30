import { FastifyRequest, FastifyReply } from 'fastify';

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. Verificar que existe el header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ success: false, message: 'No se proporcionó token de autorización' });
    }

    // 2. Verificar el formato "Bearer <token>"
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return reply.code(401).send({ success: false, message: 'Formato de token inválido' });
    }

    // 3. Verificar y decodificar el token usando la instancia de fastify-jwt
    // Esto automáticamente popula request.user con el payload
    await request.jwtVerify();

  } catch (error) {
    return reply.code(401).send({ success: false, message: 'Token inválido o expirado' });
  }
};