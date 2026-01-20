import prisma from '../lib/prisma';
import { CreateTransactionDTO, VerifyTransactionDTO } from '../types/payment.types';

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
      throw new Error('No tienes permiso para pagar esta reserva');
    }

    // Calcular el monto en USD para reportes internos
    // Si paga en VES, dividimos entre tasa. Si es USD, es igual.
    const amountInUsd = data.currency === 'VES' 
      ? data.amount / data.exchangeRate 
      : data.amount;

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
        status: 'PENDING' // Siempre nace pendiente de validación
      }
    });

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
          status: 'CONFIRMED' // La reserva ya está pagada y lista para usarse
        }
      });
    }
    
    // Si es REJECTED, la reserva se mantiene PENDING (esperando otro pago correcto)
    // o se podría cancelar, pero mejor dejarla pendiente para dar oportunidad al usuario.

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
    // Una optimización sería buscar los parkings del manager primero.
    return await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      include: { 
        user: { select: { email: true, name: true } }, // Ver quién pagó
        reservation: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};