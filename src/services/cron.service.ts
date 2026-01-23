import cron from 'node-cron';
import prisma from '../config/database';
import { emailService } from './email.service';

export const cronService = {
  
  // Iniciar el motor de tareas
  startJobs() {
    console.log('⏰ Sistema de Cron Jobs iniciado...');

    // Tarea 1: Limpieza de reservas vencidas (Cada minuto)
    cron.schedule('*/1 * * * *', async () => {
      await this.expirePendingReservations();
    });

    // Tarea 2: Enviar recordatorios 30 min antes (Cada minuto)
    cron.schedule('*/1 * * * *', async () => {
      await this.sendUpcomingReminders();
    });

    // Tarea 3: Alerta Salida (Cada minuto)
    cron.schedule('*/1 * * * *', async () => { await this.sendExpirationWarnings(); });
  },

  // Lógica A: Expirar reservas viejas (No-Show)
  async expirePendingReservations() {
    const EXPIRATION_MINUTES = 15; // 15 minutos de tolerancia para llegar
    
    const timeLimit = new Date();
    timeLimit.setMinutes(timeLimit.getMinutes() - EXPIRATION_MINUTES);

    // Buscar reservas PENDING viejas
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: timeLimit }
      }
    });

    if (expiredReservations.length > 0) {
      console.log(`🧹 Limpiando ${expiredReservations.length} reservas abandonadas...`);
      
      for (const res of expiredReservations) {
        // Transacción: Cancelar y Liberar Espacio
        await prisma.$transaction([
          prisma.reservation.update({
            where: { id: res.id },
            data: { 
              status: 'CANCELLED',
              cancellationReason: 'Expiración automática (No-Show)'
            }
          }),
          prisma.parkingSpace.update({
            where: { id: res.spaceId },
            data: { status: 'AVAILABLE' }
          })
        ]);
        console.log(`🗑️ Reserva ${res.id} cancelada automáticamente.`);
      }
    }
  },

  // Lógica B: Recordatorios (Versión Final Anti-Spam)
  async sendUpcomingReminders() {
    const now = new Date();
    
    // Usamos la ventana amplia (20 a 40 min) para asegurar que no se nos escape ninguna
    const startWindow = new Date(now.getTime() + 20 * 60000); 
    const endWindow = new Date(now.getTime() + 40 * 60000);   

    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        reminderSent: false, // <--- CLAVE: Solo las que NO hemos avisado
        startTime: {
          gte: startWindow,
          lte: endWindow
        }
      },
      include: {
        user: { select: { email: true, firstName: true } },
        parking: { select: { name: true } }
      }
    });

    if (upcomingReservations.length > 0) {
      console.log(`🔔 Enviando ${upcomingReservations.length} recordatorios nuevos...`);
      
      for (const res of upcomingReservations) {
        if (res.user.email) {
          try {
            // 1. Enviar correo
            await emailService.sendReminderEmail(
              res.user.email,
              res.user.firstName,
              res.parking.name,
              res.startTime
            );

            // 2. Marcar como enviado para no repetir
            await prisma.reservation.update({
              where: { id: res.id },
              data: { reminderSent: true }
            });
            
          } catch (error) {
            console.error(`❌ Error enviando recordatorio a ${res.user.email}`, error);
          }
        }
      }
    }
  },

  // Lógica C - Alerta de Vencimiento (15 min antes de terminar)
  async sendExpirationWarnings() {
    const now = new Date();
    
    // Ventana: Reservas que terminan entre 10 y 20 minutos desde ahora
    const startWindow = new Date(now.getTime() + 10 * 60000); 
    const endWindow = new Date(now.getTime() + 20 * 60000);   

    const activeReservations = await prisma.reservation.findMany({
      where: {
        status: 'ACTIVE',               // El usuario YA está en el parking
        expirationWarningSent: false,   // No le hemos avisado aún
        estimatedEndTime: {             // Su hora de salida se acerca
          gte: startWindow,
          lte: endWindow
        }
      },
      include: {
        user: { select: { email: true, firstName: true } },
        parking: { select: { name: true } }
      }
    });

    if (activeReservations.length > 0) {
      console.log(`⏳ Enviando ${activeReservations.length} alertas de vencimiento...`);
      
      for (const res of activeReservations) {
        if (res.user.email && res.estimatedEndTime) { // estimatedEndTime puede ser null en prisma schema, pero en lógica siempre lo seteamos
          try {
            await emailService.sendExpirationWarning(
              res.user.email,
              res.user.firstName,
              res.parking.name,
              res.estimatedEndTime
            );

            await prisma.reservation.update({
              where: { id: res.id },
              data: { expirationWarningSent: true }
            });
            
          } catch (error) {
            console.error(`❌ Error enviando alerta a ${res.user.email}`, error);
          }
        }
      }
    }
  }
};