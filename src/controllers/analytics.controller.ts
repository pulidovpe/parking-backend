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
}