@echo off
echo ========================================
echo    SMX LiveBoard - Inicializacao Otimizada
echo ========================================
echo.

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/3] Instalando dependencias...
if not exist node_modules (
    echo Instalando dependencias pela primeira vez...
    npm install --silent
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)
echo ✓ Dependencias OK

echo.
echo [3/3] Iniciando servidor consolidado...
echo.
echo ========================================
echo    SMX LiveBoard - Servidor Unificado
echo    Porta: 3000
echo    Dashboard: http://localhost:3000
echo ========================================
echo.
echo Serviços disponíveis:
echo   • Sistema: Métricas, Processos, Serviços
echo   • Terminal: Execução de comandos
echo   • SSH: Conexões remotas
echo   • Logs: Sistema de logs completo
echo   • Telegram: Alertas e notificações
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

REM Iniciar servidor consolidado (porta 3000)
node server.js

pause
