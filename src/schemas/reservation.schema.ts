import { z } from 'zod';

export const createReservationSchema = z.object({
  parkingId: z.string().uuid('ID de parking inválido'),
  spaceId: z.string().uuid('ID de espacio inválido'),
  startTime: z.string().datetime('Fecha de inicio inválida').optional(), // ISO 8601
  estimatedHours: z.number().positive().max(24, 'Máximo 24 horas por reserva').default(1),
  notes: z.string().max(500).optional(),
});

export const updateReservationSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const cancelReservationSchema = z.object({
  cancellationReason: z.string().min(5, 'Debes proporcionar una razón').max(500),
});

export const getReservationsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  parkingId: z.string().uuid().optional(),
  spaceId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
export type GetReservationsQuery = z.infer<typeof getReservationsQuerySchema>;