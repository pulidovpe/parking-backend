# --- ETAPA 1: BUILDER ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos TODAS las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Generamos el cliente de Prisma
RUN npx prisma generate

# Copiamos el resto del código fuente
COPY . .

# Compilamos TypeScript a JavaScript (crea carpeta dist)
RUN npm run build

# --- ETAPA 2: PRODUCTION ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiamos solo los archivos necesarios desde la etapa builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Instalamos SOLO dependencias de producción (más ligero)
RUN npm ci --only=production && \
    npx prisma generate

# Exponemos el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]