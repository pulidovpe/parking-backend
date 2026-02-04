FROM node:20-bullseye

WORKDIR /app

# Dependencias necesarias para Prisma
RUN apt-get update && apt-get install -y \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# IMPORTANTE: generar Prisma DENTRO del contenedor
RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
