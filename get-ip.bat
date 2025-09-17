@echo off
echo ========================================
echo    SMX LiveBoard - Descobrir IP Local
echo ========================================
echo.
echo Descobrindo seu IP local...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo Seu IP local: %%b
        echo.
        echo Para acessar o SMX LiveBoard:
        echo http://%%b:3000
        echo.
    )
)

echo ========================================
echo.
pause
