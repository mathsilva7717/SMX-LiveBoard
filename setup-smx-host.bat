@echo off
echo ========================================
echo    SMX LiveBoard - Configurar smx:3000
echo ========================================
echo.
echo Este script vai configurar o alias 'smx' para localhost
echo.
echo IMPORTANTE: Execute como Administrador!
echo.
pause

echo.
echo Adicionando entrada ao arquivo hosts...
echo.

:: Fazer backup do arquivo hosts
copy "%SystemRoot%\System32\drivers\etc\hosts" "%SystemRoot%\System32\drivers\etc\hosts.backup"

:: Adicionar entrada para smx
echo 127.0.0.1 smx >> "%SystemRoot%\System32\drivers\etc\hosts"

echo.
echo ✅ Configurado com sucesso!
echo.
echo Agora você pode acessar:
echo http://smx:3000
echo.
echo Para remover, execute: remove-smx-host.bat
echo.
pause
