import type { FastifyRequest, FastifyReply } from 'fastify';
import { ParkingService } from '../services/parking.service';
import { createParkingSchema, updateParkingSchema, searchParkingSchema } from '../schemas/parking.schema';
import { ZodError } from 'zod';
import { cacheService } from '../services/cache.service'; // Servicio de caché propuesto

const parkingService = new ParkingService();

export class ParkingController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
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
      return this.handleError(error, reply, 'Error en create parking');
    }
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const managerId = request.user?.role === 'PARKING_MANAGER' ? request.user.userId : undefined;
      const parkings = await parkingService.findAll(managerId);

      return reply.code(200).send({
        success: true,
        data: parkings,
        count: parkings.length,
      });
    } catch (error) {
      console.error('Error en findAll parkings:', error);
      return reply.code(500).send({ success: false, message: 'Error al obtener estacionamientos' });
    }
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const parking = await parkingService.findById(id);

      if (!parking) {
        return reply.code(404).send({ success: false, message: 'Estacionamiento no encontrado' });
      }

      return reply.code(200).send({ success: true, data: parking });
    } catch (error) {
      console.error('Error en findById parking:', error);
      return reply.code(500).send({ success: false, message: 'Error al obtener estacionamiento' });
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
      return this.handleError(error, reply, 'Error en update parking');
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

      return reply.code(200).send({ success: true, message: result.message });
    } catch (error) {
      return this.handleError(error, reply, 'Error en delete parking');
    }
  }

  async searchNearby(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = searchParkingSchema.parse(request.query);

      // 1. Generar Key de caché (Coordenadas redondeadas a 3 decimales para mayor eficiencia)
      const latKey = validatedData.latitude.toFixed(3);
      const lonKey = validatedData.longitude.toFixed(3);
      const radiusKey = validatedData.radiusKm || 5;
      const cacheKey = `parkings:nearby:${latKey}:${lonKey}:${radiusKey}:${validatedData.limit || 10}`;

      // 2. Intentar obtener de Redis
      const cachedResults = await cacheService.get<any[]>(cacheKey);
      if (cachedResults) {
        request.log.info(`⚡ Cache HIT para ${cacheKey}`);
        return reply.code(200).send({
          success: true,
          data: cachedResults,
          count: cachedResults.length,
          fromCache: true
        });
      }

      // 3. Consultar Base de Datos si no hay caché
      const results = await parkingService.searchNearby(
        validatedData.latitude,
        validatedData.longitude,
        validatedData.radiusKm,
        validatedData.limit
      );

      // 4. Guardar en Redis (TTL: 5 minutos / 300 segundos)
      await cacheService.set(cacheKey, results, 300);

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
      return this.handleError(error, reply, 'Error en searchNearby');
    }
  }

  // Refactorización del manejo de errores para limpieza del código
  private handleError(error: any, reply: FastifyReply, logMessage: string) {
    console.error(`${logMessage}:`, error);

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
      return reply.code(400).send({ success: false, message: error.message });
    }

    return reply.code(500).send({ success: false, message: 'Error interno del servidor' });
  }
}