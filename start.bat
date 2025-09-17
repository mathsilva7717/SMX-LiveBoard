@echo off
echo ========================================
echo    SMX LiveBoard - Iniciando Servidor
echo ========================================
echo.
echo Iniciando servidor web na porta 3000...
echo.
echo Para acessar o dashboard, use qualquer uma das opcoes:
echo.
echo 1. http://localhost:3000
echo 2. http://127.0.0.1:3000
echo 3. http://smx:3000 (se configurado)
echo 4. http://SEU-IP-LOCAL:3000
echo.
echo Para configurar http://smx:3000:
echo Execute como Admin: setup-smx-host.bat
echo.
echo Para instalar como PWA (App):
echo Execute: switch-to-localhost.bat
echo.
echo Para descobrir seu IP local, execute: ipconfig
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

cd /d "%~dp0"
node backend/index.js

pause
