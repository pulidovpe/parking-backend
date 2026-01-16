import { buildApp } from './app';
import { env } from './config/env';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.port,
      host: env.host,
    });

    console.log(`🚀 Server running on http://${env.host}:${env.port}`);
    console.log(`📍 Health check: http://${env.host}:${env.port}/health`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();