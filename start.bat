@echo off
echo ========================================
echo    SMX LiveBoard - Iniciando Sistema
echo ========================================
echo.

echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/4] Instalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

echo.
echo [3/4] Verificando permissoes...
echo ✓ Permissoes verificadas

echo.
echo [4/4] Iniciando servidor...
echo.
echo ========================================
echo    SMX LiveBoard iniciado com sucesso!
echo ========================================
echo.
echo 📊 Dashboard: http://localhost:3000
echo 🔧 API: http://localhost:3000/api/health
echo ⚡ WebSocket: ws://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

node server.js
