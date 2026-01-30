import Redis from 'ioredis';
import { env } from '../config/env';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      // Evita que la app crashee si Redis se cae, solo reintenta
      retryStrategy: (times) => Math.min(times * 50, 2000), 
    });

    this.redis.on('connect', () => console.log('✅ Conectado a Redis'));
    this.redis.on('error', (err) => console.error('❌ Error de Redis:', err));
  }

  // Obtener dato (Generic T para tipado automático)
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  // Guardar dato con expiración (ttl en segundos)
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  // Borrar una clave exacta
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // Borrar por patrón (ej: "parking:123:*") - Útil para invalidar cache
  async delByPattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ match: pattern });
    stream.on('data', (keys) => {
      if (keys.length) {
        this.redis.unlink(keys);
      }
    });
  }
}

export const cacheService = new CacheService();