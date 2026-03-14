import { PaymentMethod, PaymentStatus, Currency, ReservationStatus, PointSource } from '@prisma/client';
import prisma from '../config/database';
import { CreateTransactionDTO, VerifyTransactionDTO } from '../types/payment.types';
import { loyaltyService } from './loyalty.service';
import { emailService } from './email.service';
import { wsService } from './ws.service';

export const paymentService = {
  // 1. Usuario reporta un pago (Pago Móvil, Transferencia, etc.)
  async createTransaction(userId: string, data: CreateTransactionDTO) {
    // Verificar que la reserva existe y pertenece al usuario
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: { parking: true }
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.userId !== userId) {
        throw new Error(`No tienes permiso para pagar esta reserva. Propietario: ${reservation.userId}, Tú: ${userId}`);
    }

    // Calcular el monto en USD para reportes internos
    const amountInUsd = data.currency === 'VES' 
      ? data.amount / data.exchangeRate 
      : data.amount;

    // Lógica especial para Puntos de Fidelidad
    let autoVerifiedStatus: PaymentStatus = 'PENDING';
    
    if (data.method === 'LOYALTY_POINTS') {
      const POINTS_EXCHANGE_RATE = 10; // 10 Puntos = 1 USD
      const pointsNeeded = Math.ceil(amountInUsd * POINTS_EXCHANGE_RATE);

      const profile = await loyaltyService.getProfile(userId);
      if (profile.pointsBalance < pointsNeeded) {
        throw new Error(`Saldo insuficiente. Necesitas ${pointsNeeded} puntos (Tienes ${profile.pointsBalance})`);
      }

      await loyaltyService.addPoints(
        userId,
        -pointsNeeded,
        PointSource.REDEMPTION,
        `Pago de reserva ${data.reservationId}`
      );

      autoVerifiedStatus = 'VERIFIED';
    }
    
    // Crear la transacción con los nuevos campos de conciliación
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        reservationId: data.reservationId,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        amountInUsd,
        referenceId: data.referenceId,
        method: data.method,
        notes: data.notes,
        // ✅ NUEVOS CAMPOS DE CONCILIACIÓN
        senderBank: data.senderBank,
        senderPhone: data.senderPhone,
        senderEmail: data.senderEmail,
        // El frontend ya envía la URL de la imagen dentro de metadata
        metadata: data.metadata || {}, 
        status: autoVerifiedStatus,
      },
      include: {
        user: true
      }
    });

    // --- 📧 NOTIFICACIÓN DE PAGO (Solo si está verificado) ---
    if (transaction.status === 'VERIFIED') {
      try {
        if (transaction.user && transaction.user.email) {
          await emailService.sendPaymentReceipt(
            transaction.user.email,
            transaction.user.firstName,
            Number(transaction.amount),
            transaction.currency,
            transaction.referenceId
          );
        }
      } catch (error) {
        console.error("⚠️ Error enviando recibo de pago:", error);
      }
    }

    return transaction;
  },

  // 2. Manager verifica (Aprueba o Rechaza)
  async verifyTransaction(data: VerifyTransactionDTO) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        reservation: true,
        user: true,
      },
    });

    if (!transaction) throw new Error('Transacción no encontrada');
    if (transaction.status !== 'PENDING') {
      throw new Error(`Esta transacción ya fue procesada (estado: ${transaction.status})`);
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        status: data.status,
        verifiedBy: data.managerId,
        verifiedAt: new Date(),
      },
    });

    // Solo modificar la reserva si está en PENDING (el usuario aún no hizo check-in)
    // Si ya está ACTIVE o COMPLETED, el pago se verifica en caliente — no se toca el estado
    if (data.status === 'VERIFIED') {
      const reservationStatus = transaction.reservation.status;

      if (reservationStatus === ReservationStatus.PENDING) {
        // Flujo temprano: el manager aprobó antes del check-in → habilitar entrada
        await prisma.reservation.update({
          where: { id: transaction.reservationId },
          data: { status: ReservationStatus.ACTIVE },
        });
      }
      // Si es ACTIVE o COMPLETED → no hacer nada, el usuario ya está/estuvo adentro

      // Enviar recibo por email
      try {
        if (transaction.user?.email) {
          await emailService.sendPaymentReceipt(
            transaction.user.email,
            transaction.user.firstName,
            Number(transaction.amount),
            transaction.currency,
            transaction.referenceId,
          );
        }
      } catch (err) {
        console.error('⚠️ Error enviando recibo de pago:', err);
      }
    }

    // 🔔 Notificar al usuario por WebSocket (VERIFIED o REJECTED)
    try {
      await wsService.notifyPaymentStatus(transaction.userId, {
        transactionId: transaction.id,
        status: data.status,
        reservationId: transaction.reservationId,
        amount: Number(transaction.amount),
        currency: transaction.currency,
      });
    } catch (err) {
      console.error('⚠️ WS: Error notificando estado de pago:', err);
    }

    return updatedTransaction;
  },

  // 3. Obtener pagos de una reserva
  async getTransactionsByReservation(reservationId: string, userId: string) {
    return await prisma.transaction.findMany({
      where: { reservationId, userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  // 4. Obtener pagos pendientes (Dashboard Manager con detalles de emisor)
  async getPendingTransactions(managerId: string) {
    return await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      include: { 
        user: { 
          select: { 
            email: true, 
            firstName: true, 
            lastName: true 
          } 
        }, 
        reservation: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // 5. Historial de pagos del usuario
  async getUserHistory(userId: string) {
    return await prisma.transaction.findMany({
      where: { userId },
      include: {
        reservation: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            parking: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // 6. Estadísticas de Ingresos
  async getRevenueStats(managerId: string) {
    const totalRevenue = await prisma.transaction.aggregate({
      _sum: {
        amountInUsd: true
      },
      where: {
        status: 'VERIFIED',
        reservation: {
          parking: {
            managerId: managerId
          }
        }
      }
    });

    const statusCounts = await prisma.transaction.groupBy({
      by: ['status'],
      where: {
        reservation: {
          parking: { managerId: managerId }
        }
      },
      _count: {
        id: true
      }
    });

    const methodCounts = await prisma.transaction.groupBy({
      by: ['method'],
      where: {
        reservation: {
          parking: { managerId: managerId }
        }
      },
      _count: {
        id: true
      }
    });

    return {
      totalRevenueUsd: totalRevenue._sum.amountInUsd || 0,
      transactionsByStatus: statusCounts,
      transactionsByMethod: methodCounts
    };
  }
};