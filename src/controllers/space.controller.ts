import type { FastifyRequest, FastifyReply } from 'fastify';
import { SpaceService } from '../services/space.service';
import {
  createSpaceSchema,
  createMultipleSpacesSchema,
  updateSpaceSchema,
  bulkUpdateStatusSchema,
  getSpacesQuerySchema,
} from '../schemas/space.schema';
import { ZodError } from 'zod';

const spaceService = new SpaceService();

export class SpaceController {
  async createSpace(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para crear espacios',
        });
      }

      const validatedData = createSpaceSchema.parse(request.body);
      const result = await spaceService.createSpace(validatedData, request.user.userId);

      return reply.code(201).send({
        success: true,
        message: 'Espacio creado exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en createSpace:', error);

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

  async createMultipleSpaces(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para crear espacios',
        });
      }

      const validatedData = createMultipleSpacesSchema.parse(request.body);
      const result = await spaceService.createMultipleSpaces(validatedData, request.user.userId);

      return reply.code(201).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error en createMultipleSpaces:', error);

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

  async getSpaces(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedQuery = getSpacesQuerySchema.parse(request.query);
      const spaces = await spaceService.getSpaces(validatedQuery);

      return reply.code(200).send({
        success: true,
        data: spaces,
        count: spaces.length,
      });
    } catch (error) {
      console.error('Error en getSpaces:', error);

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
        message: 'Error al obtener espacios',
      });
    }
  }

  async getSpaceById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const space = await spaceService.getSpaceById(id);

      return reply.code(200).send({
        success: true,
        data: space,
      });
    } catch (error) {
      console.error('Error en getSpaceById:', error);

      if (error instanceof Error) {
        return reply.code(404).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error al obtener espacio',
      });
    }
  }

  async updateSpace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para actualizar espacios',
        });
      }

      const { id } = request.params;
      const validatedData = updateSpaceSchema.parse(request.body);
      const result = await spaceService.updateSpace(id, validatedData, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Espacio actualizado exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en updateSpace:', error);

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

  async bulkUpdateStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para actualizar espacios',
        });
      }

      const validatedData = bulkUpdateStatusSchema.parse(request.body);
      const result = await spaceService.bulkUpdateStatus(validatedData, request.user.userId);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error en bulkUpdateStatus:', error);

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

  async deleteSpace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (request.user?.role !== 'PARKING_MANAGER' && request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para eliminar espacios',
        });
      }

      const { id } = request.params;
      const result = await spaceService.deleteSpace(id, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error en deleteSpace:', error);

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

  async getParkingAvailability(request: FastifyRequest<{ Params: { parkingId: string } }>, reply: FastifyReply) {
    try {
      const { parkingId } = request.params;
      const result = await spaceService.getParkingAvailability(parkingId);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error en getParkingAvailability:', error);

      if (error instanceof Error) {
        return reply.code(404).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error al obtener disponibilidad',
      });
    }
  }
}