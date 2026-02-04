import { PrismaClient, UserRole, ParkingStatus, SpaceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando siembra de datos (seed)...');

  // 1. Limpieza de datos (Orden: Plazas -> Parkings -> Usuarios)
  // Nota: deleteMany es seguro porque borra todo lo viejo
  await prisma.parkingSpace.deleteMany({});
  await prisma.parking.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('Admin123', 10);
  const driverPassword = await bcrypt.hash('Driver123', 10); // Contraseña para los conductores

  // 2. Crear Usuario Manager
  const manager = await prisma.user.create({
    data: {
      email: 'admin@parking.com',
      password: hashedPassword,
      firstName: 'Pablo',
      lastName: 'Manager',
      role: UserRole.PARKING_MANAGER,
      status: 'ACTIVE',
    },
  });

  console.log('👤 Usuario Manager creado: admin@parking.com');

  // 3. Crear Estacionamiento
  const parking = await prisma.parking.create({
    data: {
      name: 'Estacionamiento Altamira Centro',
      description: 'Estacionamiento techado con vigilancia 24h.',
      address: 'Av. San Juan Bosco, Edif. Centro Altamira',
      city: 'Caracas',
      state: 'Miranda',
      zipCode: '1060',
      latitude: 10.4961,
      longitude: -66.8486,
      hourlyRate: 2.50,
      is24Hours: true,
      status: ParkingStatus.ACTIVE,
      managerId: manager.id,
    },
  });

  // Actualización PostGIS
  await prisma.$executeRawUnsafe(
    `UPDATE parkings SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
    -66.8486,
    10.4961,
    parking.id
  );

  console.log(`🅿️  Parking creado: ${parking.name}`);

  // 4. Crear Espacios
  const spaces = [
    { spaceNumber: 'A-01', status: SpaceStatus.AVAILABLE, parkingId: parking.id, isHandicapped: false, isElectric: false },
    { spaceNumber: 'A-02', status: SpaceStatus.AVAILABLE, parkingId: parking.id, isHandicapped: false, isElectric: false },
    { spaceNumber: 'M-01', status: SpaceStatus.AVAILABLE, parkingId: parking.id, isHandicapped: false, isElectric: false }, // Moto
    { spaceNumber: 'D-01', status: SpaceStatus.AVAILABLE, parkingId: parking.id, isHandicapped: true, isElectric: false },
  ];

  await prisma.parkingSpace.createMany({ data: spaces });
  console.log(`🚗 ${spaces.length} espacios creados.`);

  // 5. Crear Usuarios Conductores (Drivers)
  const drivers = [
    {
      email: 'driver1@parking.com',
      password: driverPassword,
      firstName: 'Carlos',
      lastName: 'Conductor',
      role: UserRole.DRIVER,
      status: 'ACTIVE' as any, // Forzamos el tipo por compatibilidad
      phone: '+584141234567',
    },
    {
      email: 'driver2@parking.com',
      password: driverPassword,
      firstName: 'Ana',
      lastName: 'Piloto',
      role: UserRole.DRIVER,
      status: 'ACTIVE' as any,
      phone: '+584129876543',
    },
    {
      email: 'driver3@parking.com', // Este tendrá saldo de puntos para pruebas de lealtad
      password: driverPassword,
      firstName: 'Luis',
      lastName: 'Viajero',
      role: UserRole.DRIVER,
      status: 'ACTIVE' as any,
      phone: '+584245558899',
    },
  ];

  for (const driver of drivers) {
    await prisma.user.create({ data: driver });
  }

  console.log('🚙 3 Conductores creados:');
  console.log('   - driver1@parking.com / Driver123');
  console.log('   - driver2@parking.com / Driver123');
  console.log('   - driver3@parking.com / Driver123');

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });