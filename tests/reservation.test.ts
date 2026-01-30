import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../src/app';
import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

describe('Reservation Module', () => {
  let app: any;
  let request: any;
  let driverToken: string;
  
  const uniqueId = Date.now();
  const managerData = {
    email: `manager_${uniqueId}@test.com`,
    password: 'Password123!',
    firstName: 'Manager',
    lastName: 'Test',
    role: 'PARKING_MANAGER' as const
  };
  const driverData = {
    email: `driver_${uniqueId}@test.com`,
    password: 'Password123!',
    firstName: 'Driver',
    lastName: 'Test',
    role: 'DRIVER' as const
  };

  let parkingId: string;
  let spaceId: string;
  let createdReservationId: string;
  let createdManagerId: string;
  let createdDriverId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    request = supertest(app.server);

    const hashedPassword = await bcrypt.hash(managerData.password, 10);
    
    const manager = await prisma.user.create({
      data: { ...managerData, password: hashedPassword, status: 'ACTIVE' }
    });
    createdManagerId = manager.id;

    const driver = await prisma.user.create({
      data: { ...driverData, password: hashedPassword, status: 'ACTIVE' }
    });
    createdDriverId = driver.id;

    const parking = await prisma.parking.create({
      data: {
        name: `Test Parking ${uniqueId}`,
        address: 'Calle Falsa 123',
        city: 'Test City',
        state: 'Test State',
        latitude: 4.60971,
        longitude: -74.08175,
        hourlyRate: 5.0,
        managerId: manager.id,
        status: 'ACTIVE'
      }
    });
    parkingId = parking.id;

    // --- CORRECCIÓN DE SCHEMA (totalSpaces) ---
    // Creamos un nivel para evitar errores en consultas que incluyen 'level'
    const level = await prisma.parkingLevel.create({
      data: {
        parkingId: parking.id,
        levelName: 'Piso Test',
        levelNumber: 1,
        totalSpaces: 10 // ✅ Usamos el campo correcto
      }
    });

    const space = await prisma.parkingSpace.create({
      data: {
        parkingId: parking.id,
        levelId: level.id, // Vinculamos al nivel
        spaceNumber: 'A-01',
        status: 'AVAILABLE'
      }
    });
    spaceId = space.id;

    const loginRes = await request.post('/api/auth/login').send({
      email: driverData.email,
      password: driverData.password
    });
    
    driverToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Limpieza robusta
    const reservationsToDelete = await prisma.reservation.findMany({
        where: { parkingId },
        select: { id: true }
    });
    const reservationIds = reservationsToDelete.map(r => r.id);

    if (reservationIds.length > 0) {
        await prisma.transaction.deleteMany({
            where: { reservationId: { in: reservationIds } }
        });
    }

    await prisma.reservation.deleteMany({ where: { parkingId } });
    await prisma.parkingSpace.deleteMany({ where: { parkingId } });
    await prisma.parkingLevel.deleteMany({ where: { parkingId } }); // Limpiamos niveles también
    await prisma.parking.deleteMany({ where: { id: parkingId } });
    
    await prisma.user.deleteMany({ 
      where: { id: { in: [createdManagerId, createdDriverId] } } 
    });
    
    await app.close();
  });

  // --- TESTS ---

  it('POST /api/reservations debería crear una reserva exitosa', async () => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);

    const response = await request
      .post('/api/reservations')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingId,
        spaceId,
        startTime: startTime.toISOString(),
        estimatedHours: 2,
        notes: 'Testing reservation'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    createdReservationId = response.body.data.id;
  }, 20000); // Timeout ampliado para emails

  it('POST /api/reservations debería fallar por solapamiento', async () => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);

    const response = await request
      .post('/api/reservations')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingId,
        spaceId,
        startTime: startTime.toISOString(),
        estimatedHours: 2
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/reservations/my-history debería mostrar la reserva', async () => {
    const response = await request
      .get('/api/reservations/my-history')
      .set('Authorization', `Bearer ${driverToken}`);

    // 🔥 DEBUG: Si falla, muéstrame POR QUÉ
    if (response.status !== 200) {
        console.error('❌ ERROR DETALLADO EN HISTORY:', JSON.stringify(response.body, null, 2));
    }

    expect(response.status).toBe(200);
    const found = response.body.data.find((r: any) => r.id === createdReservationId);
    expect(found).toBeDefined();
  });
});