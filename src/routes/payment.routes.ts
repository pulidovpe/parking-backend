import { FastifyInstance } from 'fastify';
import { paymentController } from '../controllers/payment.controller';

export async function paymentRoutes(fastify: FastifyInstance) {
  // Hook para proteger todas las rutas de pagos (requiere login)
  fastify.addHook('preHandler', async (request) => {
    await request.jwtVerify();
  });

  // 1. Usuario reporta un pago (Pago Móvil, Zelle, etc.)
  // POST /api/payments/report
  fastify.post('/report', paymentController.reportPayment);

  // 2. Manager verifica un pago
  // PUT /api/payments/:id/verify
  // TODO: En el futuro agregar middleware 'requireManager' aquí
  fastify.put('/:id/verify', paymentController.verifyPayment);

  // 3. Manager ve pagos pendientes
  // GET /api/payments/pending
  fastify.get('/pending', paymentController.getPending);
}