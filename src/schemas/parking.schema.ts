import { z } from 'zod';

export const createParkingSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado es requerido'),
  zipCode: z.string().optional(),
  latitude: z.number().min(-90).max(90, 'Latitud inválida'),
  longitude: z.number().min(-180).max(180, 'Longitud inválida'),
  hourlyRate: z.number().positive('La tarifa debe ser mayor a 0'),
  imageUrl: z.string().url().optional(),
  hasMultipleLevels: z.boolean().default(false),
  totalLevels: z.number().int().min(1).default(1),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  is24Hours: z.boolean().default(false),
});

export const updateParkingSchema = createParkingSchema.partial();

export const searchParkingSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(50).default(5), // Radio en kilómetros
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateParkingInput = z.infer<typeof createParkingSchema>;
export type UpdateParkingInput = z.infer<typeof updateParkingSchema>;
export type SearchParkingInput = z.infer<typeof searchParkingSchema>;