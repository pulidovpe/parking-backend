import { FastifyReply, FastifyRequest } from 'fastify';
import { paymentService } from '../services/payment.service';
import { CreateTransactionDTO, VerifyTransactionDTO } from '../types/payment.types';

export const paymentController = {
  
  // POST /payments/report
  async reportPayment(req: FastifyRequest, reply: FastifyReply) {
    try {
    
      // ESTO ES PARA DEPURAR: Mirar qué imprime el terminal
      //console.log('CONTENIDO DE REQ.USER:', req.user);
      
      // Si req.user tiene 'id', esto funciona. 
      // Si tiene 'userId', hay que cambiarlo.
      const userId = (req.user as any).id || (req.user as any).userId || (req.user as any).sub;
      //const userId = req.user.id; // Viene del JWT
      //console.log('ID EXTRAÍDO:', userId);

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
      
      // Extracción segura para evitar el error de permisos
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

  // GET /payments/pending (Solo Managers)
  async getPending(req: FastifyRequest, reply: FastifyReply) {
    try {
      const managerId = req.user.id;
      const pending = await paymentService.getPendingTransactions(managerId);
      return reply.send(pending);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  },

  // GET /payments/my-history
  async getMyHistory(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const userId = user.id || user.userId || user.sub;
      
      const history = await paymentService.getUserHistory(userId);
      return reply.send(history);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  },

  // GET /payments/stats (Solo Manager)
  async getStats(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const managerId = user.id || user.userId || user.sub;

      // Aquí podrías validar rol: if (user.role !== 'MANAGER') ...
      
      const stats = await paymentService.getRevenueStats(managerId);
      return reply.send(stats);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
};