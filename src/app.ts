import Fastify from 'fastify';
import cors from '@fastify/cors';
import fjwt from '@fastify/jwt'; 
import prisma from './config/database';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { parkingRoutes } from './routes/parking.routes';
import { spaceRoutes } from './routes/space.routes';
import { reservationRoutes } from './routes/reservation.routes';
import { paymentRoutes } from './routes/payment.routes';
import { loyaltyRoutes } from './routes/loyalty.routes';

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
  
  return app;
}