import { FastifyRequest, FastifyReply } from 'fastify';
import { cacheService } from '../services/cache.service';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Verificar formato del header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ message: 'No se proporcionó token de autorización' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.code(401).send({ message: 'Formato de token inválido' });
    }

    // 2. CHECKLIST DE SEGURIDAD (BLACKLIST)
    // Verificamos si este token específico ha sido revocado (Logout)
    const isBlacklisted = await cacheService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return reply.code(401).send({ message: 'Token revocado/invalido. Por favor inicia sesión nuevamente.' });
    }

    // 3. Verificar validez criptográfica (JWT)
    await request.jwtVerify();

  } catch (err) {
    return reply.code(401).send({ message: 'Token inválido o expirado' });
  }
}