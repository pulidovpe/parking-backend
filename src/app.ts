import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './config/database';

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

  return app;
}