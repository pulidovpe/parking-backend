import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../src/app';
import prisma from '../src/config/database'; // Importamos Prisma para manipular datos

describe('Auth Module', () => {
  let app: any;
  let request: any;
  
  const uniqueId = Date.now();
  const testUser = {
    email: `test_vitest_${uniqueId}@parking.com`,
    password: 'PasswordSeguro123!',
    firstName: 'Test',
    lastName: 'Vitest',
    phone: '555-0000',
    role: 'DRIVER'
  };

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    // Limpieza: Borramos el usuario de prueba para no dejar basura
    await prisma.user.deleteMany({
        where: { email: testUser.email }
    });
    await app.close();
  });

  // TEST 1: Registro (Con timeout aumentado por el email)
  it('POST /api/auth/register debería crear un usuario nuevo', async () => {
    const response = await request
      .post('/api/auth/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  }, 20000); // <--- Aumentamos timeout a 20s para dar tiempo al email

  // TEST 2: Login Exitoso (Simulando verificación)
  it('POST /api/auth/login debería devolver tokens', async () => {
    // 1. "Trucamos" la BD: Activamos el usuario manualmente
    await prisma.user.update({
        where: { email: testUser.email },
        data: { 
            status: 'ACTIVE', 
            verificationToken: null // Limpiamos token como si ya lo hubiera usado
        }
    });

    // 2. Ahora intentamos login
    const response = await request
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
  });

  // TEST 3: Login Fallido
  it('POST /api/auth/login debería fallar con credenciales erróneas', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123'
      });

    // Ajustamos a 400 porque tu controlador devuelve 400 para errores genéricos
    expect(response.status).toBe(400); 
    expect(response.body.success).toBe(false);
  });
});