import Fastify from 'fastify';
import cors from '@fastify/cors';
import fjwt from '@fastify/jwt'; 
import rateLimit from '@fastify/rate-limit';
import prisma from './config/database';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { parkingRoutes } from './routes/parking.routes';
import { spaceRoutes } from './routes/space.routes';
import { reservationRoutes } from './routes/reservation.routes';
import { paymentRoutes } from './routes/payment.routes';
import { loyaltyRoutes } from './routes/loyalty.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { cronService } from './services/cron.service';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // 1. REGISTRO DE JWT (Usando estructura: env.jwt.secret)
  await app.register(fjwt, {
    secret: env.jwt.secret,
    sign: {
      expiresIn: env.jwt.expiresIn,
    },
  });

  // CORS
  await app.register(cors, {
    origin: true,
  });

  // Registrar Rate Limit (GLOBAL)
  await app.register(rateLimit, {
    max: 100, // Máximo 100 peticiones
    timeWindow: '1 minute', // Por cada 1 minuto
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Has excedido el límite de peticiones. Intenta de nuevo en ${context.after}.`
      };
    }
  });

  // Health check route
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Database test route
  app.get('/db-test', async () => {
    try {
      const userCount = await prisma.user.count();
      return {
        status: 'connected',
        database: 'parking_db',
        usersCount: userCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Iniciar Cron Jobs
  cronService.startJobs();

  // Auth routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  
  // Parking routes
  await app.register(parkingRoutes, { prefix: '/api/parkings' });

  // Space routes
  await app.register(spaceRoutes, { prefix: '/api/spaces' });

  // Reservation routes
  await app.register(reservationRoutes, { prefix: '/api/reservations' });

  // Payment routes
  await app.register(paymentRoutes, { prefix: '/api/payments' });

  // Loyalty routes
  await app.register(loyaltyRoutes, { prefix: '/api/loyalty' });

  // Registrar (con prefijo)
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  
  return app;
}