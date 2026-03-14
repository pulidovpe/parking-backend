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
import { wsGateway } from './websockets/ws.gateway';
import { wsService } from './services/ws.service';

export async function buildApp() {
  // Detectar si estamos en producción
  const isProduction = process.env.NODE_ENV === 'production';

  const app = Fastify({
    logger: {
      level: 'info',
      // CONDICIONAL: Solo usar pino-pretty si NO estamos en producción.
      // En producción, usamos el logger JSON por defecto (más rápido y seguro).
      transport: isProduction ? undefined : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // 1. REGISTRO DE JWT
  await app.register(fjwt, {
    secret: env.jwt.secret,
    sign: {
      expiresIn: env.jwt.expiresIn,
    },
  });

  // CORS - Configuración mejorada
  await app.register(cors, {
    origin: isProduction 
      ? [
          // Agregar aquí los dominios permitidos en producción
          'https://tu-dominio.com',
          'https://www.tu-dominio.com',
        ]
      : true,  // En desarrollo, permite cualquier origen
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // Cache preflight por 24 horas
  });

  // Registrar Rate Limit (GLOBAL)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
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

  // Registrar analytics
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });

  // WebSocket Gateway
  await app.register(wsGateway);

  // Inicializar el subscriber de Redis para WS
  await wsService.initialize();
  
  return app;
}