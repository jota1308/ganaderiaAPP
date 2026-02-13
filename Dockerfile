# ==========================================
# Stage 1: Build
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install
#RUN npm ci --only=production


# ==========================================
# Stage 2: Production
# ==========================================
FROM node:18-alpine

# Metadata
LABEL maintainer="GanaderoApp <contacto@ganaderoapp.com>"
LABEL description="Backend API para sistema de tracking ganadero"

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar dependencias desde builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Crear directorios necesarios
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar aplicación
CMD ["node", "server.js"]
