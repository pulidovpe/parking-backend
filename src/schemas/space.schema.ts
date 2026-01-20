import { z } from 'zod';

export const createSpaceSchema = z.object({
  parkingId: z.string().uuid('ID de parking inválido'),
  levelId: z.string().uuid('ID de nivel inválido').optional(),
  spaceNumber: z.string().min(1, 'El número de espacio es requerido'),
  isHandicapped: z.boolean().default(false),
  isElectric: z.boolean().default(false),
});

export const createMultipleSpacesSchema = z.object({
  parkingId: z.string().uuid('ID de parking inválido'),
  levelId: z.string().uuid('ID de nivel inválido').optional(),
  prefix: z.string().min(1, 'El prefijo es requerido'), // Ej: "A", "B", "P1"
  startNumber: z.number().int().min(1, 'Número inicial inválido'),
  endNumber: z.number().int().min(1, 'Número final inválido'),
  isHandicapped: z.boolean().default(false),
  isElectric: z.boolean().default(false),
});

export const updateSpaceSchema = z.object({
  spaceNumber: z.string().min(1).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']).optional(),
  isHandicapped: z.boolean().optional(),
  isElectric: z.boolean().optional(),
});

export const bulkUpdateStatusSchema = z.object({
  spaceIds: z.array(z.string().uuid()).min(1, 'Debes proporcionar al menos un espacio'),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']),
});

export const getSpacesQuerySchema = z.object({
  parkingId: z.string().uuid('ID de parking inválido').optional(),
  levelId: z.string().uuid('ID de nivel inválido').optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']).optional(),
  isHandicapped: z.coerce.boolean().optional(),
  isElectric: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type CreateMultipleSpacesInput = z.infer<typeof createMultipleSpacesSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;
export type GetSpacesQuery = z.infer<typeof getSpacesQuerySchema>;