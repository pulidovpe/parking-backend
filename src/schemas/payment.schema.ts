import { z } from 'zod';

export const createPaymentSchema = z.object({
  reservationId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'VES']),
  referenceId: z.string().min(4),
  senderBank: z.string().optional(),
  senderPhone: z.string().optional(),
  senderEmail: z.string().email().optional(),
  metadata: z.record(z.any()).optional(), // Valida que sea un objeto JSON
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;