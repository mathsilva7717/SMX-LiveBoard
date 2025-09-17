@echo off
echo 🚀 SMX LiveBoard - Build Personalizado
echo.

set /p custom_name="Digite o nome do executável (sem .exe): "
if "%custom_name%"=="" set custom_name=SMX-LiveBoard

echo.
echo 📦 Criando executável: %custom_name%.exe
echo.

echo 🔄 Limpando builds anteriores...
if exist dist rmdir /s /q dist

echo.
echo 🏗️ Fazendo build do Electron...
npx electron-builder --win portable --publish=never

echo.
echo 📁 Renomeando executável...
if exist "dist\SMX-LiveBoard-Portable.exe" (
    ren "dist\SMX-LiveBoard-Portable.exe" "%custom_name%.exe"
    echo ✅ Executável criado: dist\%custom_name%.exe
) else (
    echo ❌ Erro: Executável não encontrado
)

echo.
echo 🎉 Build concluído!
echo 📁 Localização: dist\%custom_name%.exe
echo.
pause
