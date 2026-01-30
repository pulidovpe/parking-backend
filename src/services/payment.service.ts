import { PaymentMethod, PaymentStatus, Currency, ReservationStatus, PointSource } from '@prisma/client';
import prisma from '../config/database';
import { CreateTransactionDTO, VerifyTransactionDTO } from '../types/payment.types';
import { loyaltyService } from './loyalty.service';
import { emailService } from './email.service';

export const paymentService = {
  // 1. Usuario reporta un pago (Pago Móvil, Transferencia, etc.)
  async createTransaction(userId: string, data: CreateTransactionDTO) {
    // Verificar que la reserva existe y pertenece al usuario
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: { parking: true } // Para verificar montos si fuera necesario
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.userId !== userId) {
        throw new Error(`No tienes permiso para pagar esta reserva. Propietario: ${reservation.userId}, Tú: ${userId}`);
    }

    // Calcular el monto en USD para reportes internos
    // Si paga en VES, dividimos entre tasa. Si es USD, es igual.
    const amountInUsd = data.currency === 'VES' 
      ? data.amount / data.exchangeRate 
      : data.amount;

    // Lógica especial para Puntos de Fidelidad
    let autoVerifiedStatus: PaymentStatus = 'PENDING';
    
    if (data.method === 'LOYALTY_POINTS') {
      const POINTS_EXCHANGE_RATE = 10; // 10 Puntos = 1 USD
      const pointsNeeded = Math.ceil(amountInUsd * POINTS_EXCHANGE_RATE);

      // 1. Verificar saldo
      const profile = await loyaltyService.getProfile(userId);
      if (profile.pointsBalance < pointsNeeded) {
        throw new Error(`Saldo insuficiente. Necesitas ${pointsNeeded} puntos (Tienes ${profile.pointsBalance})`);
      }

      // 2. Descontar puntos (Esto genera un log negativo en LoyaltyLog)
      await loyaltyService.addPoints(
        userId,
        -pointsNeeded, // Negativo para restar
        PointSource.REDEMPTION,
        `Pago de reserva ${data.reservationId}`
      );

      // 3. Marcar como VERIFIED automáticamente (ya cobramos)
      autoVerifiedStatus = 'VERIFIED';
      console.log(`💎 Pago con puntos exitoso: -${pointsNeeded} pts`);
    }
    
    // Crear la transacción
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
        metadata: data.metadata || {},
        status: autoVerifiedStatus, // Usamos el estado calculado (VERIFIED para puntos)
      },
      // ✅ CORRECCIÓN 1: Incluir 'user' para poder acceder a sus datos (email, nombre) más abajo
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
    // Buscar transacción
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: { reservation: true }
    });

    if (!transaction) throw new Error('Transacción no encontrada');

    // Actualizar estado de la transacción
    const updatedTransaction = await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        status: data.status,
        verifiedBy: data.managerId,
        verifiedAt: new Date()
      }
    });

    // LÓGICA DE NEGOCIO CRÍTICA:
    // Si el pago es VERIFIED, confirmamos la reserva automáticamente.
    if (data.status === 'VERIFIED') {
      await prisma.reservation.update({
        where: { id: transaction.reservationId },
        data: {
          status: ReservationStatus.ACTIVE // La reserva ya está pagada y lista para usarse
        }
      });
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

  // 4. Obtener pagos pendientes (Para el Dashboard del Manager)
  async getPendingTransactions(managerId: string) {
    // Aquí deberíamos filtrar por los parkings del manager, 
    // pero para el MVP asumimos que el manager ve todo o filtramos después.
    return await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      include: { 
        // ✅ CORRECCIÓN 2: Cambiado 'name' por 'firstName' y 'lastName' (UserSelect)
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

  // 5. Historial de pagos del usuario (Conductor)
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

  // 6. Estadísticas de Ingresos (Para Dashboard del Manager)
  async getRevenueStats(managerId: string) {
    // A. Calcular Ingreso Total Confirmado (Suma de amountInUsd)
    // Filtramos transacciones donde la reserva pertenece a un parking de este manager
    const totalRevenue = await prisma.transaction.aggregate({
      _sum: {
        amountInUsd: true
      },
      where: {
        status: 'VERIFIED', // Solo dinero real verificado
        reservation: {
          parking: {
            managerId: managerId // Filtro de seguridad: solo sus estacionamientos
          }
        }
      }
    });

    // B. Conteo por Estado (Para saber cuántos pagos hay pendientes)
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

    // C. Conteo por Método de Pago (Para saber qué usan más: Binance, Pago Móvil?)
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