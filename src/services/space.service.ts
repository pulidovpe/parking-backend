import prisma from '../config/database';
import type { 
  CreateSpaceInput, 
  CreateMultipleSpacesInput, 
  UpdateSpaceInput,
  BulkUpdateStatusInput,
  GetSpacesQuery 
} from '../schemas/space.schema';

export class SpaceService {
  // Verificar que el parking pertenece al manager
  private async verifyParkingOwnership(parkingId: string, managerId: string) {
    const parking = await prisma.parking.findFirst({
      where: { id: parkingId, managerId },
    });

    if (!parking) {
      throw new Error('Estacionamiento no encontrado o no tienes permisos');
    }

    return parking;
  }

  // Crear un espacio individual
  async createSpace(data: CreateSpaceInput, managerId: string) {
    await this.verifyParkingOwnership(data.parkingId, managerId);

    // Verificar si el nivel existe (si se proporciona)
    if (data.levelId) {
      const level = await prisma.parkingLevel.findFirst({
        where: { 
          id: data.levelId,
          parkingId: data.parkingId,
        },
      });

      if (!level) {
        throw new Error('Nivel no encontrado en este estacionamiento');
      }
    }

    // Verificar que el número de espacio no esté duplicado
    const existing = await prisma.parkingSpace.findUnique({
      where: {
        parkingId_spaceNumber: {
          parkingId: data.parkingId,
          spaceNumber: data.spaceNumber,
        },
      },
    });

    if (existing) {
      throw new Error(`El espacio ${data.spaceNumber} ya existe en este estacionamiento`);
    }

    const space = await prisma.parkingSpace.create({
      data: {
        parkingId: data.parkingId,
        levelId: data.levelId,
        spaceNumber: data.spaceNumber,
        isHandicapped: data.isHandicapped,
        isElectric: data.isElectric,
      },
      include: {
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
        level: {
          select: {
            id: true,
            levelName: true,
            levelNumber: true,
          },
        },
      },
    });

    // Actualizar contador de espacios en el nivel (si aplica)
    if (data.levelId) {
      await this.updateLevelSpaceCount(data.levelId);
    }

    return space;
  }

  // Crear múltiples espacios en lote
  async createMultipleSpaces(data: CreateMultipleSpacesInput, managerId: string) {
    await this.verifyParkingOwnership(data.parkingId, managerId);

    if (data.endNumber < data.startNumber) {
      throw new Error('El número final debe ser mayor o igual al número inicial');
    }

    const totalSpaces = data.endNumber - data.startNumber + 1;

    if (totalSpaces > 500) {
      throw new Error('No puedes crear más de 500 espacios a la vez');
    }

    // Generar espacios
    const spacesToCreate = [];
    for (let i = data.startNumber; i <= data.endNumber; i++) {
      spacesToCreate.push({
        parkingId: data.parkingId,
        levelId: data.levelId,
        spaceNumber: `${data.prefix}-${i.toString().padStart(3, '0')}`,
        isHandicapped: data.isHandicapped,
        isElectric: data.isElectric,
      });
    }

    const result = await prisma.parkingSpace.createMany({
      data: spacesToCreate,
      skipDuplicates: true,
    });

    // Actualizar contador de espacios en el nivel (si aplica)
    if (data.levelId) {
      await this.updateLevelSpaceCount(data.levelId);
    }

    return {
      created: result.count,
      total: totalSpaces,
      message: `${result.count} espacios creados exitosamente`,
    };
  }

  // Actualizar contador de espacios en un nivel
  private async updateLevelSpaceCount(levelId: string) {
    const count = await prisma.parkingSpace.count({
      where: { levelId },
    });

    await prisma.parkingLevel.update({
      where: { id: levelId },
      data: { totalSpaces: count },
    });
  }

  // Obtener espacios con filtros
  async getSpaces(query: GetSpacesQuery) {
    const where: any = {};

    if (query.parkingId) where.parkingId = query.parkingId;
    if (query.levelId) where.levelId = query.levelId;
    if (query.status) where.status = query.status;
    if (query.isHandicapped !== undefined) where.isHandicapped = query.isHandicapped;
    if (query.isElectric !== undefined) where.isElectric = query.isElectric;

    const spaces = await prisma.parkingSpace.findMany({
      where,
      include: {
        parking: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        level: {
          select: {
            id: true,
            levelName: true,
            levelNumber: true,
          },
        },
      },
      orderBy: [
        { parking: { name: 'asc' } },
        { level: { levelNumber: 'asc' } },
        { spaceNumber: 'asc' },
      ],
    });

    return spaces;
  }

  // Obtener un espacio por ID
  async getSpaceById(id: string) {
    const space = await prisma.parkingSpace.findUnique({
      where: { id },
      include: {
        parking: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            managerId: true,
          },
        },
        level: {
          select: {
            id: true,
            levelName: true,
            levelNumber: true,
          },
        },
      },
    });

    if (!space) {
      throw new Error('Espacio no encontrado');
    }

    return space;
  }

  // Actualizar un espacio
  async updateSpace(id: string, data: UpdateSpaceInput, managerId: string) {
    const space = await this.getSpaceById(id);
    
    await this.verifyParkingOwnership(space.parkingId, managerId);

    const updated = await prisma.parkingSpace.update({
      where: { id },
      data,
      include: {
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
        level: {
          select: {
            id: true,
            levelName: true,
          },
        },
      },
    });

    return updated;
  }

  // Actualizar estado de múltiples espacios
  async bulkUpdateStatus(data: BulkUpdateStatusInput, managerId: string) {
    // Verificar que todos los espacios pertenecen a parkings del manager
    const spaces = await prisma.parkingSpace.findMany({
      where: { id: { in: data.spaceIds } },
      include: {
        parking: {
          select: { managerId: true },
        },
      },
    });

    if (spaces.length !== data.spaceIds.length) {
      throw new Error('Algunos espacios no fueron encontrados');
    }

    const unauthorizedSpaces = spaces.filter(s => s.parking.managerId !== managerId);
    if (unauthorizedSpaces.length > 0) {
      throw new Error('No tienes permisos para modificar algunos de estos espacios');
    }

    const result = await prisma.parkingSpace.updateMany({
      where: { id: { in: data.spaceIds } },
      data: { status: data.status },
    });

    return {
      updated: result.count,
      message: `${result.count} espacios actualizados a ${data.status}`,
    };
  }

  // Eliminar un espacio
  async deleteSpace(id: string, managerId: string) {
    const space = await this.getSpaceById(id);
    
    await this.verifyParkingOwnership(space.parkingId, managerId);

    // No permitir eliminar espacios ocupados o reservados
    if (space.status === 'OCCUPIED' || space.status === 'RESERVED') {
      throw new Error(`No puedes eliminar un espacio que está ${space.status}`);
    }

    await prisma.parkingSpace.delete({
      where: { id },
    });

    // Actualizar contador de espacios en el nivel (si aplica)
    if (space.levelId) {
      await this.updateLevelSpaceCount(space.levelId);
    }

    return { message: 'Espacio eliminado exitosamente' };
  }

  // Obtener resumen de disponibilidad de un parking
  async getParkingAvailability(parkingId: string) {
    const parking = await prisma.parking.findUnique({
      where: { id: parkingId },
      select: {
        id: true,
        name: true,
        hasMultipleLevels: true,
      },
    });

    if (!parking) {
      throw new Error('Estacionamiento no encontrado');
    }

    // Contar espacios por estado
    const summary = await prisma.parkingSpace.groupBy({
      by: ['status'],
      where: { parkingId },
      _count: { status: true },
    });

    const totalSpaces = await prisma.parkingSpace.count({
      where: { parkingId },
    });

    const statusCounts = {
      AVAILABLE: 0,
      OCCUPIED: 0,
      RESERVED: 0,
      OUT_OF_SERVICE: 0,
    };

    summary.forEach(item => {
      statusCounts[item.status] = item._count.status;
    });

    // Si tiene múltiples niveles, obtener disponibilidad por nivel
    let levelAvailability = null;
    if (parking.hasMultipleLevels) {
      const levels = await prisma.parkingLevel.findMany({
        where: { parkingId },
        select: {
          id: true,
          levelNumber: true,
          levelName: true,
          totalSpaces: true,
        },
        orderBy: { levelNumber: 'asc' },
      });

      levelAvailability = await Promise.all(
        levels.map(async (level) => {
          const levelSummary = await prisma.parkingSpace.groupBy({
            by: ['status'],
            where: { levelId: level.id },
            _count: { status: true },
          });

          const levelStatusCounts = {
            AVAILABLE: 0,
            OCCUPIED: 0,
            RESERVED: 0,
            OUT_OF_SERVICE: 0,
          };

          levelSummary.forEach(item => {
            levelStatusCounts[item.status] = item._count.status;
          });

          return {
            ...level,
            availability: levelStatusCounts,
          };
        })
      );
    }

    return {
      parking: {
        id: parking.id,
        name: parking.name,
      },
      totalSpaces,
      availability: statusCounts,
      occupancyRate: totalSpaces > 0 
        ? ((statusCounts.OCCUPIED + statusCounts.RESERVED) / totalSpaces * 100).toFixed(2) 
        : '0.00',
      levels: levelAvailability,
    };
  }
}