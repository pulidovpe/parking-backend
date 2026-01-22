import { FastifyInstance } from 'fastify';
import { AnalyticsController } from '../controllers/analytics.controller';

const analyticsController = new AnalyticsController();

export async function analyticsRoutes(app: FastifyInstance) {
  // Seguridad: Todas las rutas requieren Token
  app.addHook('preHandler', async (request) => {
    await request.jwtVerify();
  });

  // GET /api/analytics/dashboard
  app.get('/dashboard', analyticsController.getDashboard.bind(analyticsController));

  // GET /api/analytics/revenue
  app.get('/revenue', analyticsController.getRevenueChart.bind(analyticsController));

  // GET /api/analytics/occupancy
  app.get('/occupancy', analyticsController.getOccupancyHeatmap.bind(analyticsController));

  // RUTAS para top users y export
  app.get('/top-users', analyticsController.getTopUsers.bind(analyticsController));
  app.get('/export', analyticsController.exportReport.bind(analyticsController));
}