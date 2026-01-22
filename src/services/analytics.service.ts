import prisma from '../config/database';
import { startOfDay, endOfDay, subDays, format } from 'date-fns'; // Necesitaremos instalar date-fns si no la tienes, o usar JS nativo

// Helper simple para fechas si no queremos instalar librerías extra aún
const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
  }
  return dates;
};

export class AnalyticsService {
  
  // 1. KPI Cards (Indicadores principales)
  async getDashboardKPIs(managerId: string) {
    // Filtrar parkings de este manager
    const parkings = await prisma.parking.findMany({
      where: { managerId },
      select: { id: true }
    });
    const parkingIds = parkings.map(p => p.id);

    // A. Ingreso Total (Solo transacciones VERIFIED)
    const revenue = await prisma.transaction.aggregate({
      _sum: { amountInUsd: true },
      where: {
        status: 'VERIFIED',
        reservation: { parkingId: { in: parkingIds } }
      }
    });

    // B. Total Reservas Completadas
    const completedReservations = await prisma.reservation.count({
      where: {
        status: 'COMPLETED',
        parkingId: { in: parkingIds }
      }
    });

    // C. Ocupación Actual (Reservas activas ahora mismo)
    const activeNow = await prisma.reservation.count({
      where: {
        status: 'ACTIVE',
        parkingId: { in: parkingIds }
      }
    });

    return {
      totalRevenue: Number(revenue._sum.amountInUsd || 0),
      totalReservations: completedReservations,
      currentOccupancy: activeNow
    };
  }

  // 2. Gráfico de Ingresos (Últimos 7 días)
  async getRevenueChart(managerId: string) {
    const parkings = await prisma.parking.findMany({ where: { managerId }, select: { id: true } });
    const parkingIds = parkings.map(p => p.id);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Agrupar por fecha de creación
    // Nota: Prisma no soporta groupBy por fecha formateada directamente en todos los drivers.
    // Traemos la data cruda y agrupamos en JS para máxima compatibilidad.
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'VERIFIED',
        reservation: { parkingId: { in: parkingIds } },
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        amountInUsd: true
      }
    });

    // Procesar datos para el gráfico
    const chartData: Record<string, number> = {};
    
    // Inicializar en 0 los últimos 7 días
    getLast7Days().forEach(date => {
      chartData[date] = 0;
    });

    // Sumar montos
    transactions.forEach(tx => {
      const dateKey = tx.createdAt.toISOString().split('T')[0];
      if (chartData[dateKey] !== undefined) {
        chartData[dateKey] += Number(tx.amountInUsd);
      }
    });

    // Convertir a array para frontend [{ date: '2023-01-01', value: 50 }, ...]
    return Object.entries(chartData).map(([date, value]) => ({ date, value }));
  }

  // 3. Gráfico de Popularidad (Reservas por hora del día)
  async getPopularHours(managerId: string) {
    const parkings = await prisma.parking.findMany({ where: { managerId }, select: { id: true } });
    const parkingIds = parkings.map(p => p.id);

    const reservations = await prisma.reservation.findMany({
      where: { parkingId: { in: parkingIds } },
      select: { startTime: true }
    });

    const hoursDistribution = new Array(24).fill(0);

    reservations.forEach(res => {
      const hour = res.startTime.getHours(); // 0 a 23
      hoursDistribution[hour]++;
    });

    return hoursDistribution.map((count, hour) => ({
      hour: `${hour}:00`,
      count
    }));
  }
}