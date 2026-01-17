import prisma from '../config/database';
import type { CreateParkingInput, UpdateParkingInput } from '../schemas/parking.schema';

export class ParkingService {
  async create(data: CreateParkingInput, managerId: string) {
    // Crear el parking
    const parking = await prisma.parking.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: data.latitude,
        longitude: data.longitude,
        hourlyRate: data.hourlyRate,
        imageUrl: data.imageUrl,
        hasMultipleLevels: data.hasMultipleLevels,
        totalLevels: data.totalLevels,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        is24Hours: data.is24Hours,
        managerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Actualizar la columna location usando PostGIS
    await prisma.$executeRawUnsafe(
      `UPDATE parkings SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      data.longitude,
      data.latitude,
      parking.id
    );

    // Si tiene múltiples niveles, crear los niveles
    if (data.hasMultipleLevels && data.totalLevels > 1) {
      const levels = [];
      for (let i = 1; i <= data.totalLevels; i++) {
        levels.push({
          parkingId: parking.id,
          levelNumber: i,
          levelName: `Nivel ${i}`,
        });
      }

      await prisma.parkingLevel.createMany({
        data: levels,
      });
    }

    return parking;
  }

  async findById(id: string) {
    const parking = await prisma.parking.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        levels: {
          orderBy: { levelNumber: 'asc' },
        },
        spaces: {
          orderBy: { spaceNumber: 'asc' },
        },
      },
    });

    return parking;
  }

  async findAll(managerId?: string) {
    const where = managerId ? { managerId } : {};

    return prisma.parking.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            spaces: true,
            levels: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateParkingInput, managerId: string) {
    // Verificar que el parking pertenece al manager
    const parking = await prisma.parking.findFirst({
      where: { id, managerId },
    });

    if (!parking) {
      throw new Error('Estacionamiento no encontrado o no tienes permisos');
    }

    // Actualizar
    const updated = await prisma.parking.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: data.latitude,
        longitude: data.longitude,
        hourlyRate: data.hourlyRate,
        imageUrl: data.imageUrl,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        is24Hours: data.is24Hours,
        status: data.hasMultipleLevels !== undefined ? undefined : parking.status,
      },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Si se actualizó la ubicación, actualizar PostGIS
    if (data.latitude !== undefined && data.longitude !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE parkings SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        data.longitude,
        data.latitude,
        id
      );
    }

    return updated;
  }

  async delete(id: string, managerId: string) {
    // Verificar que el parking pertenece al manager
    const parking = await prisma.parking.findFirst({
      where: { id, managerId },
    });

    if (!parking) {
      throw new Error('Estacionamiento no encontrado o no tienes permisos');
    }

    await prisma.parking.delete({
      where: { id },
    });

    return { message: 'Estacionamiento eliminado exitosamente' };
  }

  async searchNearby(latitude: number, longitude: number, radiusKm: number = 5, limit: number = 20) {
    try {
      console.log('🔍 Search params:', { latitude, longitude, radiusKm, limit });

      // Búsqueda usando PostGIS ST_DWithin (radio en metros)
      const radiusMeters = radiusKm * 1000;

      const results = await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT 
          p.id,
          p.name,
          p.description,
          p.address,
          p.city,
          p.state,
          p.zip_code,
          p.latitude,
          p.longitude,
          p.status,
          p.hourly_rate,
          p.image_url,
          p.has_multiple_levels,
          p.total_levels,
          p.opening_time,
          p.closing_time,
          p.is_24_hours,
          p.manager_id,
          p.created_at,
          p.updated_at,
          ST_Distance(
            location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) as distance_meters,
          (
            SELECT COUNT(*) 
            FROM parking_spaces ps 
            WHERE ps.parking_id = p.id AND ps.status = 'AVAILABLE'
          )::integer as available_spaces
        FROM parkings p
        WHERE p.status = 'ACTIVE'
          AND location IS NOT NULL
          AND ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
          )
        ORDER BY distance_meters ASC
        LIMIT $4
        `,
        longitude,
        latitude,
        radiusMeters,
        limit
      );

      console.log('✅ Query executed, results:', results.length);

      return results.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        address: r.address,
        city: r.city,
        state: r.state,
        zipCode: r.zip_code,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        status: r.status,
        hourlyRate: Number(r.hourly_rate),
        imageUrl: r.image_url,
        hasMultipleLevels: r.has_multiple_levels,
        totalLevels: r.total_levels,
        openingTime: r.opening_time,
        closingTime: r.closing_time,
        is24Hours: r.is_24_hours,
        managerId: r.manager_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        distanceMeters: Number(r.distance_meters),
        distanceKm: (Number(r.distance_meters) / 1000).toFixed(2),
        availableSpaces: Number(r.available_spaces),
      }));
    } catch (error) {
      console.error('❌ Error in searchNearby:', error);
      throw error;
    }
  }
}