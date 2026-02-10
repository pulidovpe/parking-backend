import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

// Definición del esquema de validación
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerida"),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  JWT_SECRET: z.string().min(1, "JWT_SECRET es requerida"),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET es requerida"),
  ENCRYPTION_KEY: z.string().min(1, "ENCRYPTION_KEY es requerida"),
});

// Validación de las variables de proceso
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Variables de entorno inválidas:', _env.error.format());
  process.exit(1);
}

// Exportación del objeto env tipado y validado
export const env = {
  nodeEnv: _env.data.NODE_ENV,
  port: parseInt(_env.data.PORT, 10),
  host: _env.data.HOST,
  databaseUrl: _env.data.DATABASE_URL,
  redis: {
    host: _env.data.REDIS_HOST,
    port: parseInt(_env.data.REDIS_PORT, 10),
  },
  jwt: {
    secret: _env.data.JWT_SECRET,
    expiresIn: _env.data.JWT_EXPIRES_IN,
    refreshSecret: _env.data.JWT_REFRESH_SECRET,
    refreshExpiresIn: '7d', // Mantenemos tu valor fijo
  },
  encryptionKey: _env.data.ENCRYPTION_KEY,
};