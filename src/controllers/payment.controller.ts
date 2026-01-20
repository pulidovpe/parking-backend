import { FastifyReply, FastifyRequest } from 'fastify';
import { paymentService } from '../services/payment.service';
import { CreateTransactionDTO, VerifyTransactionDTO } from '../types/payment.types';

export const paymentController = {
  
  // POST /payments/report
  async reportPayment(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = req.user.id; // Viene del JWT
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

  // PUT /payments/:id/verify (Solo Managers)
  async verifyPayment(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string }; // ID de la transacción
      const { status } = req.body as { status: 'VERIFIED' | 'REJECTED' };
      const managerId = req.user.id;

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

  // GET /payments/pending (Solo Managers)
  async getPending(req: FastifyRequest, reply: FastifyReply) {
    try {
      const managerId = req.user.id;
      const pending = await paymentService.getPendingTransactions(managerId);
      return reply.send(pending);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
};