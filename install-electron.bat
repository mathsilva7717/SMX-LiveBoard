@echo off
echo 🚀 Instalando dependências do SMX LiveBoard...
echo.

echo 📦 Instalando dependências principais...
call npm install

echo.
echo 🔧 Instalando dependências do Electron...
call npm install electron electron-builder --save-dev

echo.
echo ✅ Instalação concluída!
echo.
echo 📋 Comandos disponíveis:
echo   npm run electron:dev  - Executar em modo desenvolvimento
echo   npm run electron      - Executar aplicativo
echo   npm run build:portable - Criar executável portable
echo   npm run dist          - Build completo
echo.
pause
