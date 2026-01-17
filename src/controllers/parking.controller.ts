import type { FastifyRequest, FastifyReply } from 'fastify';
import { ParkingService } from '../services/parking.service';
import { createParkingSchema, updateParkingSchema, searchParkingSchema } from '../schemas/parking.schema';
import { ZodError } from 'zod';

const parkingService = new ParkingService();

export class ParkingController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Verificar que el usuario es PARKING_MANAGER
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'Solo los gestores de estacionamiento pueden crear parkings',
        });
      }

      const validatedData = createParkingSchema.parse(request.body);
      const result = await parkingService.create(validatedData, request.user.userId);

      return reply.code(201).send({
        success: true,
        message: 'Estacionamiento creado exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en create parking:', error);

      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return reply.code(400).send({
          success: false,
          message: 'Error de validación',
          errors: formattedErrors,
        });
      }

      if (error instanceof Error) {
        return reply.code(400).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Si es PARKING_MANAGER, solo sus parkings
      // Si es ADMIN o DRIVER, todos los parkings
      const managerId = request.user?.role === 'PARKING_MANAGER' ? request.user.userId : undefined;

      const parkings = await parkingService.findAll(managerId);

      return reply.code(200).send({
        success: true,
        data: parkings,
        count: parkings.length,
      });
    } catch (error) {
      console.error('Error en findAll parkings:', error);

      return reply.code(500).send({
        success: false,
        message: 'Error al obtener estacionamientos',
      });
    }
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const parking = await parkingService.findById(id);

      if (!parking) {
        return reply.code(404).send({
          success: false,
          message: 'Estacionamiento no encontrado',
        });
      }

      return reply.code(200).send({
        success: true,
        data: parking,
      });
    } catch (error) {
      console.error('Error en findById parking:', error);

      return reply.code(500).send({
        success: false,
        message: 'Error al obtener estacionamiento',
      });
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para actualizar estacionamientos',
        });
      }

      const { id } = request.params;
      const validatedData = updateParkingSchema.parse(request.body);
      const result = await parkingService.update(id, validatedData, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Estacionamiento actualizado exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en update parking:', error);

      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return reply.code(400).send({
          success: false,
          message: 'Error de validación',
          errors: formattedErrors,
        });
      }

      if (error instanceof Error) {
        return reply.code(400).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para eliminar estacionamientos',
        });
      }

      const { id } = request.params;
      const result = await parkingService.delete(id, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error en delete parking:', error);

      if (error instanceof Error) {
        return reply.code(400).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async searchNearby(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = searchParkingSchema.parse(request.query);

      const results = await parkingService.searchNearby(
        validatedData.latitude,
        validatedData.longitude,
        validatedData.radiusKm,
        validatedData.limit
      );

      return reply.code(200).send({
        success: true,
        data: results,
        count: results.length,
        searchParams: {
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          radiusKm: validatedData.radiusKm,
        },
      });
    } catch (error) {
      console.error('Error en searchNearby:', error);

      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return reply.code(400).send({
          success: false,
          message: 'Error de validación',
          errors: formattedErrors,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error al buscar estacionamientos cercanos',
      });
    }
  }
}