import prisma from '../config/database';
import type {
  CreateReservationInput,
  UpdateReservationInput,
  CancelReservationInput,
  GetReservationsQuery,
} from '../schemas/reservation.schema';
import { loyaltyService } from './loyalty.service';
import { PointSource } from '@prisma/client';

export class ReservationService {
  // Crear una reserva
  async createReservation(data: CreateReservationInput, userId: string) {
    // Verificar que el espacio existe
    const space = await prisma.parkingSpace.findUnique({
      where: { id: data.spaceId },
      include: {
        parking: true,
      },
    });

    if (!space) {
      throw new Error('Espacio no encontrado');
    }

    // Verificar que el espacio pertenece al parking indicado
    if (space.parkingId !== data.parkingId) {
      throw new Error('El espacio no pertenece a este estacionamiento');
    }

    // Verificar que el espacio esté disponible
    if (space.status !== 'AVAILABLE') {
      const statusMessages: Record<string, string> = {
        RESERVED: 'El espacio ya está reservado por otro usuario',
        OCCUPIED: 'El espacio está actualmente ocupado',
        OUT_OF_SERVICE: 'El espacio está fuera de servicio',
      };
      
      throw new Error(statusMessages[space.status] || `El espacio no está disponible (${space.status})`);
    }

    // Verificar que el parking esté activo
    if (space.parking.status !== 'ACTIVE') {
      throw new Error('El estacionamiento no está disponible');
    }

    // Calcular tiempos
    const startTime = data.startTime ? new Date(data.startTime) : new Date();
    const estimatedEndTime = new Date(startTime.getTime() + data.estimatedHours * 60 * 60 * 1000);

    // Verificar que no hay reservas activas para este espacio en el rango de tiempo
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        spaceId: data.spaceId,
        status: {
          in: ['PENDING', 'ACTIVE'],
        },
        OR: [
          {
            startTime: {
              lte: estimatedEndTime,
            },
            estimatedEndTime: {
              gte: startTime,
            },
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw new Error('El espacio ya tiene una reserva en ese horario');
    }

    // Calcular costo estimado
    const hourlyRate = space.parking.hourlyRate;
    const estimatedCost = hourlyRate * data.estimatedHours;

    // Crear la reserva
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        parkingId: data.parkingId,
        spaceId: data.spaceId,
        startTime,
        estimatedEndTime,
        hourlyRate,
        estimatedCost,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        parking: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        space: {
          select: {
            id: true,
            spaceNumber: true,
            level: {
              select: {
                levelName: true,
                levelNumber: true,
              },
            },
          },
        },
      },
    });

    // Cambiar el estado del espacio a RESERVED
    await prisma.parkingSpace.update({
      where: { id: data.spaceId },
      data: { status: 'RESERVED' },
    });

    return reservation;
  }

  // Activar una reserva (cuando el usuario llega)
  async activateReservation(id: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        space: true,
      },
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.userId !== userId) {
      throw new Error('No tienes permisos para activar esta reserva');
    }

    if (reservation.status !== 'PENDING') {
      throw new Error(`No puedes activar una reserva con estado ${reservation.status}`);
    }

    // Actualizar reserva a ACTIVE
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startTime: new Date(), // Actualizar hora real de inicio
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        parking: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        space: {
          select: {
            id: true,
            spaceNumber: true,
          },
        },
      },
    });

    // Cambiar estado del espacio a OCCUPIED
    await prisma.parkingSpace.update({
      where: { id: reservation.spaceId },
      data: { status: 'OCCUPIED' },
    });

    return updated;
  }

  // Completar una reserva (cuando el usuario sale)
  async completeReservation(id: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.userId !== userId) {
      throw new Error('No tienes permisos para completar esta reserva');
    }

    if (reservation.status !== 'ACTIVE') {
      throw new Error(`No puedes completar una reserva con estado ${reservation.status}. Primero debes activarla.`);
    }

    const actualEndTime = new Date();
    // Calcular duración en milisegundos
    const durationMs = actualEndTime.getTime() - reservation.startTime.getTime();
    // Convertir a horas (redondeando hacia arriba)
    const actualHours = Math.ceil(durationMs / (1000 * 60 * 60)); 
    
    // VALIDACIÓN IMPORTANTE PARA PRUEBAS:
    // Si la prueba es muy rápida (milisegundos), cobramos mínimo 1 hora para generar costo
    // 1. Calcular costo base
    const hoursToCharge = actualHours < 1 ? 1 : actualHours;
    let finalCost = reservation.hourlyRate * hoursToCharge;

    const actualCost = reservation.hourlyRate * hoursToCharge;

    // 2. --- APLICAR DESCUENTO POR NIVEL (Fase 1I - Beneficios) ---
    // Obtenemos el perfil del usuario
    const loyaltyProfile = await prisma.loyaltyProfile.findUnique({ where: { userId } });
    
    let discountApplied = 0;
    if (loyaltyProfile) {
      const discountPercent = loyaltyService.getDiscountPercentage(loyaltyProfile.tier);
      if (discountPercent > 0) {
        discountApplied = finalCost * discountPercent;
        finalCost = finalCost - discountApplied;
        console.log(`🤑 Descuento aplicado por nivel ${loyaltyProfile.tier}: -$${discountApplied}`);
      }
    }
    // -----------------------------------------------------------
    
    // Actualizar reserva en BD
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndTime,
        actualCost: finalCost,
      },
      include: {
        user: true, 
        parking: true,
      },
    });

    // --- 🎁 LÓGICA DE PUNTOS (CORREGIDA) ---
    // Eliminamos el 'if (data.status...)' porque aquí SIEMPRE es completed.
    const costForPoints = updated.actualCost || 0;
    const pointsEarned = Math.floor(Number(costForPoints)); // 1 USD = 1 Punto

    if (pointsEarned > 0) {
      console.log(`🎁 Intentando dar ${pointsEarned} puntos al usuario ${updated.userId}`);
      try {
        await loyaltyService.addPoints(
          updated.userId,
          pointsEarned,
          PointSource.RESERVATION_COMPLETED,
          `Reserva completada en ${updated.parking.name}`
        );
        console.log(`✅ Puntos otorgados exitosamente.`);
      } catch (error) {
        console.error("❌ Error dando puntos:", error);
      }
    }
    // ----------------------------------------

    // Liberar el espacio
    await prisma.parkingSpace.update({
      where: { id: reservation.spaceId },
      data: { status: 'AVAILABLE' },
    });

    return updated;
  }

  // Cancelar una reserva
  async cancelReservation(id: string, data: CancelReservationInput, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.userId !== userId) {
      throw new Error('No tienes permisos para cancelar esta reserva');
    }

    if (!['PENDING', 'ACTIVE'].includes(reservation.status)) {
      throw new Error(`No puedes cancelar una reserva con estado ${reservation.status}`);
    }

    // Actualizar reserva
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: data.cancellationReason,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
        space: {
          select: {
            id: true,
            spaceNumber: true,
          },
        },
      },
    });

    // Liberar el espacio si estaba reservado
    if (reservation.status === 'PENDING' || reservation.status === 'ACTIVE') {
      await prisma.parkingSpace.update({
        where: { id: reservation.spaceId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  }

  // Obtener reservas con filtros
  async getReservations(query: GetReservationsQuery) {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.parkingId) where.parkingId = query.parkingId;
    if (query.spaceId) where.spaceId = query.spaceId;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) where.startTime.gte = new Date(query.startDate);
      if (query.endDate) where.startTime.lte = new Date(query.endDate);
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        parking: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        space: {
          select: {
            id: true,
            spaceNumber: true,
            level: {
              select: {
                levelName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservations;
  }

  // Obtener una reserva por ID
  async getReservationById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        parking: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
          },
        },
        space: {
          select: {
            id: true,
            spaceNumber: true,
            isHandicapped: true,
            isElectric: true,
            level: {
              select: {
                levelName: true,
                levelNumber: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    return reservation;
  }

  // Actualizar notas de una reserva
  async updateReservation(id: string, data: UpdateReservationInput, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.userId !== userId) {
      throw new Error('No tienes permisos para actualizar esta reserva');
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        notes: data.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
        space: {
          select: {
            id: true,
            spaceNumber: true,
          },
        },
      },
    });

    return updated;
  }
}