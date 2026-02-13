#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "🐄 GanaderoApp - Iniciando sistema completo..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null
then
    echo "${YELLOW}⚠️  Node.js no está instalado. Por favor instala Node.js desde https://nodejs.org/${NC}"
    exit 1
fi

echo "${GREEN}✓ Node.js instalado: $(node --version)${NC}"
echo ""

# Instalar dependencias del backend (en la raíz del repo)
echo "${BLUE}📦 Instalando dependencias del backend...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   Dependencias ya instaladas"
fi

# Iniciar backend
echo ""
echo "${BLUE}🚀 Iniciando backend en puerto 3001...${NC}"
node server.js &
BACKEND_PID=$!

# Esperar a que el backend esté listo
sleep 3

# Verificar que el backend está corriendo
if ps -p $BACKEND_PID > /dev/null; then
    echo "${GREEN}✓ Backend corriendo en http://localhost:3001${NC}"
else
    echo "${YELLOW}⚠️  Error al iniciar el backend${NC}"
    exit 1
fi

echo ""
echo "${BLUE}🌐 Iniciando dashboard web en puerto 8080...${NC}"

# Verificar si http-server está instalado
if ! command -v http-server &> /dev/null
then
    echo "   Instalando http-server..."
    npm install -g http-server
fi

http-server "$ROOT_DIR" -p 8080 &
WEB_PID=$!

sleep 2

echo ""
echo "${GREEN}════════════════════════════════════════════════════════${NC}"
echo "${GREEN}✓ Sistema iniciado correctamente!${NC}"
echo ""
echo "📊 Dashboard Web:    ${BLUE}http://localhost:8080${NC}"
echo "🔧 Backend API:      ${BLUE}http://localhost:3001${NC}"
echo ""
echo "👤 Usuario demo:"
echo "   Email:    demo@campo.com"
echo "   Password: demo123"
echo ""
echo "${YELLOW}Para detener el sistema, presiona Ctrl+C${NC}"
echo "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "${YELLOW}Deteniendo sistema...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    echo "${GREEN}Sistema detenido.${NC}"
    exit 0
}

# Capturar señal de interrupción
trap cleanup INT TERM

# Mantener el script corriendo
wait
