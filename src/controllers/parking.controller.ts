import type { FastifyRequest, FastifyReply } from 'fastify';
import { ParkingService } from '../services/parking.service';
import { createParkingSchema, updateParkingSchema, searchParkingSchema } from '../schemas/parking.schema';
import { ZodError } from 'zod';
import { cacheService } from '../services/cache.service';

const parkingService = new ParkingService();

export class ParkingController {
  
  // --- Crear Parking ---
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

  // --- Listar Todos (Manager) ---
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const managerId = request.user?.role === 'PARKING_MANAGER' ? request.user.userId : undefined;
      const parkings = await parkingService.findAll(managerId);

      return reply.code(200).send({
        success: true,
        data: parkings,
      });
    } catch (error) {
      return this.handleError(error, reply, 'Error en findAll parkings');
    }
  }

  // --- Buscar por ID ---
  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const parking = await parkingService.findById(id);

      if (!parking) {
        return reply.code(404).send({ success: false, message: 'Estacionamiento no encontrado' });
      }

      return reply.code(200).send({ success: true, data: parking });
    } catch (error) {
      return this.handleError(error, reply, 'Error en findById parking');
    }
  }

  // --- Actualizar Parking ---
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      
      // Validar datos de entrada
      const validatedData = updateParkingSchema.parse(request.body);
      
      // ✅ CORREGIDO: Se eliminó el 4to argumento (request.user.role)
      const updatedParking = await parkingService.update(id, validatedData, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Estacionamiento actualizado',
        data: updatedParking,
      });
    } catch (error) {
      return this.handleError(error, reply, 'Error en update parking');
    }
  }

  // --- Eliminar Parking ---
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      
      // ✅ CORREGIDO: Se eliminó el 3er argumento (request.user.role)
      await parkingService.delete(id, request.user.userId);

      return reply.code(200).send({
        success: true,
        message: 'Estacionamiento eliminado correctamente',
      });
    } catch (error) {
      return this.handleError(error, reply, 'Error en delete parking');
    }
  }

  // --- BUSCAR CERCANOS ---
  async searchNearby(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Obtener query params
      const query = request.query as any;

      // Mapear lat/lng a latitude/longitude si vienen abreviados
      const rawData = {
        ...query,
        latitude: query.latitude ?? query.lat,
        longitude: query.longitude ?? query.lng,
        radiusKm: query.radiusKm ?? query.radius // Soporte extra para 'radius'
      };

      // 2. Revisar Caché
      const latKey = Number(rawData.latitude).toFixed(3);
      const lngKey = Number(rawData.longitude).toFixed(3);
      const cacheKey = `parking:search:${latKey}:${lngKey}:${rawData.radiusKm}`;

      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        return reply.code(200).send({
          success: true,
          data: cachedResults,
          source: 'cache'
        });
      }

      // 3. Validar con Zod
      const validatedData = searchParkingSchema.parse(rawData);

      // 4. Consultar Base de Datos
      const results = await parkingService.searchNearby(
        validatedData.latitude,
        validatedData.longitude,
        validatedData.radiusKm,
        validatedData.limit
      );

      // 5. Guardar en Redis (TTL: 5 minutos)
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

  // --- Manejo Centralizado de Errores ---
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
        // Ajuste de códigos HTTP según el mensaje de error
        const status = error.message.includes('no encontrado') ? 404 
                     : error.message.includes('permiso') ? 403 
                     : 400;
        
        return reply.code(status).send({ success: false, message: error.message });
    }

    return reply.code(500).send({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}