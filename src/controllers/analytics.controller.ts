import { FastifyReply, FastifyRequest } from 'fastify';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  // 1. KPI Cards (Resumen del Dashboard)
  async getDashboard(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const managerId = user.id || user.userId || user.sub;

      const stats = await this.analyticsService.getDashboardKPIs(managerId);
      return reply.send({ success: true, data: stats });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  }

  // 2. Gráfico de Ingresos (Línea de tiempo)
  async getRevenueChart(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const managerId = user.id || user.userId || user.sub;

      const chartData = await this.analyticsService.getRevenueChart(managerId);
      return reply.send({ success: true, data: chartData });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  }

  // 3. Mapa de Calor (Horas populares)
  async getOccupancyHeatmap(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const managerId = user.id || user.userId || user.sub;

      const data = await this.analyticsService.getPopularHours(managerId);
      return reply.send({ success: true, data: data });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  }

  // 4. Top Users
  async getTopUsers(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const managerId = user.id || user.userId || user.sub;

      const data = await this.analyticsService.getTopUsers(managerId);
      return reply.send({ success: true, data });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  }

  // 5. Exportar a CSV
  async exportReport(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const managerId = user.id || user.userId || user.sub;

      const data = await this.analyticsService.getExportData(managerId);

      // Convertir JSON a CSV Manualmente (simple y efectivo)
      const headers = ['Fecha', 'Hora', 'Parking', 'Cliente', 'Email', 'Monto (USD)', 'Metodo', 'Referencia'];
      
      const csvRows = data.map(row => {
        return [
          row.date,
          row.time,
          `"${row.parking}"`, // Comillas para evitar errores si el nombre tiene comas
          `"${row.client}"`,
          row.email,
          row.amount,
          row.method,
          row.reference
        ].join(',');
      });

      const csvString = [headers.join(','), ...csvRows].join('\n');

      // Configurar headers para descarga
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename="reporte_ingresos.csv"');
      
      return reply.send(csvString);

    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  }
}