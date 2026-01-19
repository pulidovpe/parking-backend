import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './config/database';
import { authRoutes } from './routes/auth.routes';
import { parkingRoutes } from './routes/parking.routes';
import { spaceRoutes } from './routes/space.routes';
import { reservationRoutes } from './routes/reservation.routes';

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
  
  return app;
}