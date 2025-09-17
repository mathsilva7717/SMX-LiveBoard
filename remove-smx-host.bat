@echo off
echo ========================================
echo    SMX LiveBoard - Remover smx:3000
echo ========================================
echo.
echo Este script vai remover o alias 'smx' do arquivo hosts
echo.
echo IMPORTANTE: Execute como Administrador!
echo.
pause

echo.
echo Removendo entrada do arquivo hosts...
echo.

:: Restaurar backup do arquivo hosts
if exist "%SystemRoot%\System32\drivers\etc\hosts.backup" (
    copy "%SystemRoot%\System32\drivers\etc\hosts.backup" "%SystemRoot%\System32\drivers\etc\hosts"
    echo ✅ Alias 'smx' removido com sucesso!
) else (
    echo ❌ Backup não encontrado. Removendo manualmente...
    findstr /v "smx" "%SystemRoot%\System32\drivers\etc\hosts" > "%SystemRoot%\System32\drivers\etc\hosts.tmp"
    move "%SystemRoot%\System32\drivers\etc\hosts.tmp" "%SystemRoot%\System32\drivers\etc\hosts"
    echo ✅ Alias 'smx' removido manualmente!
)

echo.
echo Agora use apenas: http://localhost:3000
echo.
pause
