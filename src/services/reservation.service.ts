import prisma from '../config/database';
import type {
  CreateReservationInput,
  UpdateReservationInput,
  CancelReservationInput,
  GetReservationsQuery,
} from '../schemas/reservation.schema';
import { loyaltyService } from './loyalty.service';
import { PointSource } from '@prisma/client';
import { emailService } from '../services/email.service';
import { cacheService } from './cache.service';

export class ReservationService {
  
  // Crear una reserva (SOLUCIÓN RACE CONDITION)
  async createReservation(data: CreateReservationInput, userId: string) {
    
    // 1. Ejecutamos todo dentro de una transacción para garantizar atomicidad
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Validaciones iniciales (Lectura)
      const space = await tx.parkingSpace.findUnique({
        where: { id: data.spaceId },
        include: { parking: true },
      });

      if (!space) throw new Error('Espacio no encontrado');
      if (space.parkingId !== data.parkingId) throw new Error('El espacio no pertenece a este estacionamiento');
      if (space.parking.status !== 'ACTIVE') throw new Error('El estacionamiento no está disponible');

      // Calcular tiempos
      const startTime = data.startTime ? new Date(data.startTime) : new Date();
      const estimatedEndTime = new Date(startTime.getTime() + data.estimatedHours * 60 * 60 * 1000);

      // B. Verificar conflictos de horario (Lectura)
      const conflictingReservation = await tx.reservation.findFirst({
        where: {
          spaceId: data.spaceId,
          status: { in: ['PENDING', 'ACTIVE'] },
          OR: [
            {
              startTime: { lte: estimatedEndTime },
              estimatedEndTime: { gte: startTime },
            },
          ],
        },
      });

      if (conflictingReservation) {
        throw new Error('El espacio ya tiene una reserva en ese horario');
      }

      // C. INTENTO DE BLOQUEO (Escritura Crítica)
      // Usamos updateMany con una cláusula WHERE que incluye el estado 'AVAILABLE'.
      // Si otro usuario reservó hace 1ms, el estado ya no será AVAILABLE y count será 0.
      const updateResult = await tx.parkingSpace.updateMany({
        where: {
          id: data.spaceId,
          status: 'AVAILABLE' // 🔒 Candado Optimista
        },
        data: { status: 'RESERVED' }
      });

      if (updateResult.count === 0) {
        // Si llegamos aquí, alguien ganó la carrera por milisegundos
        throw new Error('El espacio fue ocupado por otro usuario mientras confirmabas.');
      }

      // D. Crear la reserva (Solo si ganamos el bloqueo)
      const hourlyRate = space.parking.hourlyRate;
      const estimatedCost = hourlyRate * data.estimatedHours;

      const reservation = await tx.reservation.create({
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
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          parking: { select: { id: true, name: true, address: true, city: true } },
          space: { 
            select: { 
              id: true, 
              spaceNumber: true, 
              level: { select: { levelName: true, levelNumber: true } } 
            } 
          },
        },
      });

      return reservation;
    });

    // 2. Tareas fuera de la transacción (Side Effects)
    // Si la transacción falló, esto nunca se ejecuta.
    
    // Invalidar caché
    await cacheService.del(`spaces:availability:${data.parkingId}`);

    // Enviar correo
    try {
        if (result.user.email) {
            await emailService.sendReservationConfirmation(
              result.user.email,
              result.parking.name,
              result.startTime,
              Number(result.estimatedCost)
            );
        }
    } catch (error) {
        console.error("⚠️ No se pudo enviar el correo de confirmación:", error);
    }

    return result;
  }

  // Activar una reserva (cuando el usuario llega)
  async activateReservation(id: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { space: true },
    });

    if (!reservation) throw new Error('Reserva no encontrada');
    if (reservation.userId !== userId) throw new Error('No tienes permisos para activar esta reserva');
    if (reservation.status !== 'PENDING') throw new Error(`No puedes activar una reserva con estado ${reservation.status}`);

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startTime: new Date(),
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        parking: { select: { id: true, name: true, address: true } },
        space: { select: { id: true, spaceNumber: true } },
      },
    });

    await prisma.parkingSpace.update({
      where: { id: reservation.spaceId },
      data: { status: 'OCCUPIED' },
    });

    await cacheService.del(`spaces:availability:${reservation.parkingId}`);
    return updated;
  }

  // Completar una reserva (cuando el usuario sale)
  async completeReservation(id: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) throw new Error('Reserva no encontrada');
    if (reservation.userId !== userId) throw new Error('No tienes permisos para completar esta reserva');
    if (reservation.status !== 'ACTIVE') throw new Error(`No puedes completar una reserva con estado ${reservation.status}. Primero debes activarla.`);

    const actualEndTime = new Date();
    const durationMs = actualEndTime.getTime() - reservation.startTime.getTime();
    const actualHours = Math.ceil(durationMs / (1000 * 60 * 60)); 
    
    const hoursToCharge = actualHours < 1 ? 1 : actualHours;
    let finalCost = reservation.hourlyRate * hoursToCharge;

    // Descuento por lealtad
    const loyaltyProfile = await prisma.loyaltyProfile.findUnique({ where: { userId } });
    if (loyaltyProfile) {
      const discountPercent = loyaltyService.getDiscountPercentage(loyaltyProfile.tier);
      if (discountPercent > 0) {
        const discountApplied = finalCost * discountPercent;
        finalCost = finalCost - discountApplied;
      }
    }
    
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndTime,
        actualCost: finalCost,
      },
      include: { user: true, parking: true },
    });

    // Puntos de lealtad
    const pointsEarned = Math.floor(Number(updated.actualCost || 0));
    if (pointsEarned > 0) {
      try {
        await loyaltyService.addPoints(
          updated.userId,
          pointsEarned,
          PointSource.RESERVATION_COMPLETED,
          `Reserva completada en ${updated.parking.name}`
        );
      } catch (error) {
        console.error("❌ Error dando puntos:", error);
      }
    }

    await prisma.parkingSpace.update({
      where: { id: reservation.spaceId },
      data: { status: 'AVAILABLE' },
    });

    await cacheService.del(`spaces:availability:${reservation.parkingId}`);
    return updated;
  }

  // Cancelar una reserva
  async cancelReservation(id: string, data: CancelReservationInput, userId: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) throw new Error('Reserva no encontrada');
    if (reservation.userId !== userId) throw new Error('No tienes permisos para cancelar esta reserva');
    if (!['PENDING', 'ACTIVE'].includes(reservation.status)) throw new Error(`No puedes cancelar una reserva con estado ${reservation.status}`);

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: data.cancellationReason,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        parking: { select: { id: true, name: true } },
        space: { select: { id: true, spaceNumber: true } },
      },
    });

    if (reservation.status === 'PENDING' || reservation.status === 'ACTIVE') {
      await prisma.parkingSpace.update({
        where: { id: reservation.spaceId },
        data: { status: 'AVAILABLE' },
      });
    }

    await cacheService.del(`spaces:availability:${reservation.parkingId}`);
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

    return prisma.reservation.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        parking: { select: { id: true, name: true, address: true, city: true } },
        space: { 
          select: { 
            id: true, 
            spaceNumber: true, 
            level: { select: { levelName: true } } 
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Obtener reserva por ID
  async getReservationById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        parking: { select: { id: true, name: true, description: true, address: true, city: true, state: true, latitude: true, longitude: true } },
        space: { 
          select: { 
            id: true, 
            spaceNumber: true, 
            isHandicapped: true, 
            isElectric: true, 
            level: { select: { levelName: true, levelNumber: true } } 
          } 
        },
      },
    });

    if (!reservation) throw new Error('Reserva no encontrada');
    return reservation;
  }

  // Actualizar notas
  async updateReservation(id: string, data: UpdateReservationInput, userId: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new Error('Reserva no encontrada');
    if (reservation.userId !== userId) throw new Error('No tienes permisos para actualizar esta reserva');

    return prisma.reservation.update({
      where: { id },
      data: { notes: data.notes },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        parking: { select: { id: true, name: true } },
        space: { select: { id: true, spaceNumber: true } },
      },
    });
  }

  // Historial
  async getMyHistory(userId: string) {
    return prisma.reservation.findMany({
      where: { userId },
      include: {
        parking: { select: { name: true, address: true, city: true } },
        space: { 
          select: { 
            spaceNumber: true, 
            level: { select: { levelName: true } } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}