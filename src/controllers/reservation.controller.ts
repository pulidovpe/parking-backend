import type { FastifyRequest, FastifyReply } from 'fastify';
import { ReservationService } from '../services/reservation.service';
import {
  createReservationSchema,
  updateReservationSchema,
  cancelReservationSchema,
  getReservationsQuerySchema,
} from '../schemas/reservation.schema';
import { ZodError } from 'zod';

const reservationService = new ReservationService();

export class ReservationController {
  async createReservation(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const validatedData = createReservationSchema.parse(request.body);
      const result = await reservationService.createReservation(validatedData, request.user.userId);

      return reply.code(201).send({
        success: true,
        message: 'Reserva creada exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en createReservation:', error);

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

  async activateReservation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const { id } = request.params;
      const result = await reservationService.activateReservation(id, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Reserva activada exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en activateReservation:', error);

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

  async completeReservation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const { id } = request.params;
      const result = await reservationService.completeReservation(id, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Reserva completada exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en completeReservation:', error);

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

  async cancelReservation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const { id } = request.params;
      const validatedData = cancelReservationSchema.parse(request.body);
      const result = await reservationService.cancelReservation(id, validatedData, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Reserva cancelada exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en cancelReservation:', error);

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

  async getReservations(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const validatedQuery = getReservationsQuerySchema.parse(request.query);

      // Si es DRIVER, solo puede ver sus propias reservas
      if (request.user.role === 'DRIVER') {
        validatedQuery.userId = request.user.userId;
      }

      const reservations = await reservationService.getReservations(validatedQuery);

      return reply.code(200).send({
        success: true,
        data: reservations,
        count: reservations.length,
      });
    } catch (error) {
      console.error('Error en getReservations:', error);

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
        message: 'Error al obtener reservas',
      });
    }
  }

  async getReservationById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const { id } = request.params;
      const reservation = await reservationService.getReservationById(id);

      // Verificar permisos: solo el dueño o managers del parking pueden ver
      if (
        reservation.userId !== request.user.userId &&
        request.user.role !== 'ADMIN' &&
        !(request.user.role === 'PARKING_MANAGER' && reservation.parking.id)
      ) {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permisos para ver esta reserva',
        });
      }

      return reply.code(200).send({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('Error en getReservationById:', error);

      if (error instanceof Error) {
        return reply.code(404).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Error al obtener reserva',
      });
    }
  }

  async updateReservation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const { id } = request.params;
      const validatedData = updateReservationSchema.parse(request.body);
      const result = await reservationService.updateReservation(id, validatedData, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Reserva actualizada exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Error en updateReservation:', error);

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

  // NUEVO: Historial personal del usuario
  async getMyHistory(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const userId = user.id || user.userId || user.sub;

      // Reutilizamos el servicio pero forzamos el filtro userId
      const reservations = await this.reservationService.getReservations({ userId });
      
      return reply.send({ success: true, data: reservations });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  }
}