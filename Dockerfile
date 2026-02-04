# --- ETAPA 1: BUILDER ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos TODAS las dependencias
RUN npm ci

# ⚠️ CLAVE: Generamos el cliente. 
# Como schema.prisma ya tiene "linux-musl-openssl-3.0.x", 
# esto descargará el motor correcto.
RUN npx prisma generate

# Copiamos el resto del código fuente
COPY . .

# Compilamos
RUN npm run build

# --- ETAPA 2: PRODUCTION ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Instalamos SOLO dependencias de producción
# Y regeneramos el cliente para asegurar que los binarios estén ahí
RUN npm ci --only=production && \
    npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
