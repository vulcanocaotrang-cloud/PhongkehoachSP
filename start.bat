@echo off
chcp 65001 > nul
title BST Manager — Khoi dong
color 0A

echo.
echo  ====================================================
echo   BST Manager - Dang khoi dong...
echo  ====================================================
echo.

:: ── Kiem tra Node.js ────────────────────────────────────────────────────
node --version > nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [LOI] Node.js chua duoc cai dat!
    echo  Tai Node.js LTS tai: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: ── Kiem tra thu muc ────────────────────────────────────────────────────
if not exist "%~dp0backend\node_modules" (
    echo  [THIEU] Chua cai dependencies. Chay setup.bat truoc!
    echo.
    pause
    exit /b 1
)

:: ── Tat cac tien trinh cu tren cong 3001 ────────────────────────────────
echo  [1/3] Dang tat tien trinh cu (cong 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /PID %%a /F > nul 2>&1
)
timeout /t 1 > nul

:: ── Khoi dong Backend ────────────────────────────────────────────────────
echo  [2/3] Dang khoi dong Backend...
start "BST-Backend" /min cmd /k "title BST-BACKEND && color 0B && cd /d %~dp0backend && npm run dev"

:: Doi backend san sang (kiem tra cong 3001 toi da 30 giay)
set RETRY=0
:wait_backend
set /a RETRY=%RETRY%+1
if %RETRY% gtr 30 (
    echo  [CANH BAO] Backend chua san sang sau 30 giay
    echo  Kiem tra cua so "BST-BACKEND" de xem loi!
    goto start_frontend
)
netstat -an 2>nul | findstr ":3001.*LISTENING" > nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 > nul
    echo  Dang cho backend... (%RETRY%/30)
    goto wait_backend
)
echo  [OK] Backend da san sang tren cong 3001!

:: ── Khoi dong Frontend ───────────────────────────────────────────────────
:start_frontend
echo  [3/3] Dang khoi dong Frontend...
start "BST-Frontend" /min cmd /k "title BST-FRONTEND && color 0E && cd /d %~dp0frontend && npm run dev"
timeout /t 4 > nul

:: Lay IP de hien thi
for /f "tokens=2 delims=:" %%A in ('ipconfig 2^>nul ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%A
    goto :ip_found
)
:ip_found
set LOCAL_IP=%LOCAL_IP: =%

:: ── Mo trinh duyet ──────────────────────────────────────────────────────
echo.
echo  ====================================================
echo   Da khoi dong thanh cong!
echo.
echo   Tren may nay : http://localhost:5173
echo   Mang noi bo  : http://%LOCAL_IP%:5173
echo.
echo   Cua so "BST-BACKEND"  = logs backend
echo   Cua so "BST-FRONTEND" = logs frontend
echo  ====================================================
echo.
start http://localhost:5173

echo  Nhan phim bat ky de dong cua so nay...
pause > nul
