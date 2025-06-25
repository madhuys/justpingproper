#!/bin/bash

# JustPing Development Startup Script
# This script starts both the backend and frontend development servers

echo "🚀 Starting JustPing Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🔄 Shutting down development servers...${NC}"
    pkill -P $$
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}📋 Pre-flight checks...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ This script must be run from the justping2 root directory${NC}"
    echo "Expected structure:"
    echo "  justping2/"
    echo "  ├── package.json (backend)"
    echo "  ├── frontend/"
    echo "  └── start-dev.sh"
    exit 1
fi

# Check required ports
echo "Checking ports..."
check_port 3001 || exit 1  # Backend
check_port 3000 || exit 1  # Frontend

# Check if node_modules exist
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd frontend && npm install && cd ..
fi

echo -e "${GREEN}✅ All pre-flight checks passed!${NC}"
echo ""

# Start backend server
echo -e "${BLUE}🔧 Starting Backend Server (Port 3001)...${NC}"
PORT=3001 npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo -e "${BLUE}🎨 Starting Frontend Server (Port 3000)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for both servers to start
sleep 5

echo ""
echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo ""
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 Backend:${NC}  http://localhost:3001"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  • Press Ctrl+C to stop both servers"
echo "  • Frontend hot-reload is enabled"
echo "  • Backend auto-restart is enabled"
echo "  • Check logs below for any issues"
echo ""
echo -e "${BLUE}📊 Server Logs:${NC}"
echo "=================================================="

# Wait for background processes
wait