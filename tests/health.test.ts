import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../src/app'; // Importamos la app sin levantarla (sin listen)

describe('Health Check Endpoint', () => {
  let app: any;
  let request: any;

  // 1. Antes de los tests, construimos la app
  beforeAll(async () => {
    app = await buildApp();
    await app.ready(); // Esperamos a que plugins carguen
    request = supertest(app.server); // Conectamos supertest
  });

  // 2. Al terminar, cerramos todo (Redis, DB)
  afterAll(async () => {
    await app.close();
  });

  // 3. El Test
  it('GET /health debería devolver status ok', async () => {
    const response = await request.get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ 
      status: 'ok', 
      timestamp: expect.any(String) // Cualquier string nos vale
    });
  });
});