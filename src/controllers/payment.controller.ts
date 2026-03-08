import { FastifyReply, FastifyRequest } from 'fastify';
import { paymentService } from '../services/payment.service';
import { CreateTransactionDTO } from '../types/payment.types';

export const paymentController = {
  
  async reportPayment(req: FastifyRequest, reply: FastifyReply) {
    try {
      // Extracción de ID robusta para tu entorno de desarrollo
      const userId = (req.user as any).id || (req.user as any).userId || (req.user as any).sub;

      // Casteamos el body al DTO que ahora incluye los campos de emisor
      const data = req.body as CreateTransactionDTO;      
      
      const transaction = await paymentService.createTransaction(userId, data);
      
      return reply.code(201).send({
        message: 'Pago reportado exitosamente. Esperando validación.',
        data: transaction
      });
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  },

  async verifyPayment(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: 'VERIFIED' | 'REJECTED' };
      const managerId = (req.user as any).id || (req.user as any).userId || (req.user as any).sub;

      const transaction = await paymentService.verifyTransaction({
        transactionId: id,
        status,
        managerId
      });

      return reply.send({
        message: `Pago ${status === 'VERIFIED' ? 'verificado' : 'rechazado'} correctamente`,
        data: transaction
      });
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  },

  async getPending(req: FastifyRequest, reply: FastifyReply) {
    try {
      const managerId = (req.user as any).id || (req.user as any).userId || (req.user as any).sub;
      const pending = await paymentService.getPendingTransactions(managerId);
      return reply.send(pending);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  },

  async getMyHistory(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req.user as any).id || (req.user as any).userId || (req.user as any).sub;
      const history = await paymentService.getUserHistory(userId);
      return reply.send(history);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  },

  async getStats(req: FastifyRequest, reply: FastifyReply) {
    try {
      const managerId = (req.user as any).id || (req.user as any).userId || (req.user as any).sub;
      const stats = await paymentService.getRevenueStats(managerId);
      return reply.send(stats);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
};