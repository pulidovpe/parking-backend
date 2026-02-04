#!/bin/bash
set -eux

apt-get update -y
apt-get install -y docker.io docker-compose-plugin awscli

systemctl enable docker
systemctl start docker

REGION="${region}"
ACCOUNT_ID="${account_id}"

# 3. Detección automática de permisos de IAM/ECR
echo "Verificando identidad de IAM..."
if aws sts get-caller-identity --region "$REGION" > /dev/null 2>&1; then
    echo "Identidad detectada. Intentando login en ECR..."
    
    # Reintento por si el rol tarda en propagarse (Race Condition)
    for i in {1..6}; do
      if aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"; then
        echo "Login exitoso en ECR."
        break
      else
        echo "Reintentando login... ($i/6)"
        sleep 10
      fi
    done
else
    echo "ADVERTENCIA: No se detectaron credenciales de IAM. Se omitirá el login de ECR."
    echo "Asegúrate de que la instancia tenga el Instance Profile configurado en Terraform."
fi
cat <<EOF > .env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://${db_user}:${db_password}@postgres:5432/${db_name}?schema=public"
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}
JWT_EXPIRES_IN=15m
ENCRYPTION_KEY=${encryption_key}
SMTP_HOST=${smtp_host}
SMTP_PORT=${smtp_port}
SMTP_USER=${smtp_user}
SMTP_PASS=${smtp_pass}
SMTP_FROM=${smtp_from}
ACCOUNT_ID=${account_id}
EOF

cat <<EOF > docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: ${account_id}.dkr.ecr.${region}.amazonaws.com/parking-backend:latest
    restart: always
    ports:
      - "80:3000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgis/postgis:15-3.3-alpine
    restart: always
    environment:
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: \${DB_NAME}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER} -d \${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data_prod:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data_prod:
  redis_data_prod:
EOF

# Levantar todo
docker compose -f docker-compose.prod.yml up -d
