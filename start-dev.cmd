@echo off
REM JustPing Development Startup Script for Windows
REM This script starts both the backend and frontend development servers

echo 🚀 Starting JustPing Development Environment...
echo.

REM Function to check if port is available (simplified for Windows)
echo 📋 Pre-flight checks...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Backend package.json not found
    echo This script must be run from the justping2 root directory
    echo Expected structure:
    echo   justping2/
    echo   ├── package.json (backend^)
    echo   ├── frontend/
    echo   └── start-dev.cmd
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Frontend directory not found
    pause
    exit /b 1
)

REM Check if node_modules exist
echo Checking dependencies...
if not exist "node_modules" (
    echo ⚠️  Backend dependencies not found. Installing...
    call npm install
)

if not exist "frontend\node_modules" (
    echo ⚠️  Frontend dependencies not found. Installing...
    cd frontend
    call npm install
    cd ..
)

echo ✅ All pre-flight checks passed!
echo.

REM Start backend server
echo 🔧 Starting Backend Server (Port 8080^)...
start "Backend Server" cmd /k "set PORT=8080 && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server
echo 🎨 Starting Frontend Server (Port 3000^)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

REM Wait a moment for both servers to start
timeout /t 5 /nobreak > nul

echo.
echo 🎉 Development environment is ready!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8080
echo.
echo 💡 Tips:
echo   • Close both terminal windows to stop servers
echo   • Frontend hot-reload is enabled
echo   • Backend auto-restart is enabled
echo.
echo Press any key to exit this launcher...
pause > nul