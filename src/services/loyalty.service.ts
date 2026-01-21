import prisma from '../config/database';
import { LoyaltyTier, PointSource } from '@prisma/client';

// Configuración de niveles (Puntos necesarios para alcanzar cada nivel)
const TIER_THRESHOLDS = {
  [LoyaltyTier.BRONZE]: 0,
  [LoyaltyTier.SILVER]: 500,
  [LoyaltyTier.GOLD]: 1500,
  [LoyaltyTier.PLATINUM]: 5000,
};

export const loyaltyService = {
  
  // 1. Obtener (o crear) el perfil de un usuario
  async getProfile(userId: string) {
    // Usamos upsert: si no existe, lo crea (útil para usuarios viejos o nuevos registros)
    return await prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { 
        logs: { 
          orderBy: { createdAt: 'desc' },
          take: 5 // Solo mostramos los últimos 5 movimientos por defecto
        } 
      }
    });
  },

  // 2. Sumar Puntos (Motor Principal)
  async addPoints(userId: string, points: number, source: PointSource, description?: string) {
    // Primero aseguramos que tenga perfil
    const profile = await this.getProfile(userId);

    const newBalance = profile.pointsBalance + points;
    const newLifetime = profile.lifetimePoints + (points > 0 ? points : 0); // Solo sumamos al histórico si son puntos positivos

    // Calcular nuevo nivel basado en el histórico (Lifetime Points)
    let newTier = profile.tier;
    if (newLifetime >= TIER_THRESHOLDS.PLATINUM) newTier = 'PLATINUM';
    else if (newLifetime >= TIER_THRESHOLDS.GOLD) newTier = 'GOLD';
    else if (newLifetime >= TIER_THRESHOLDS.SILVER) newTier = 'SILVER';

    // Transacción atómica: Actualizar perfil + Crear log
    const updatedProfile = await prisma.$transaction([
      prisma.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          pointsBalance: newBalance,
          lifetimePoints: newLifetime,
          tier: newTier
        }
      }),
      prisma.loyaltyLog.create({
        data: {
          profileId: profile.id,
          points,
          source,
          description
        }
      })
    ]);

    return updatedProfile[0]; // Retornamos el perfil actualizado
  }
};