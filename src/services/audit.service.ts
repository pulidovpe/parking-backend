import prisma from '../config/database';

interface CreateLogInput {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  async log(data: CreateLogInput) {
    try {
      // Guardamos el log de forma asíncrona (sin await bloqueante si no queremos frenar la app)
      // Pero por seguridad, usaremos await aquí para garantizar que se guarde.
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details, // Prisma maneja el JSON automáticamente
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Si falla el log, no deberíamos detener la aplicación, pero sí reportarlo en consola
      console.error('❌ Error guardando Audit Log:', error);
    }
  },
};