@echo off
chcp 65001 > nul
echo ====================================================
echo   BST Manager — Cai dat va khoi dong
echo ====================================================
echo.

:: Check Node.js
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Node.js chua duoc cai dat!
    echo Vui long tai Node.js LTS tai: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js: && node --version

:: Install backend
echo.
echo [1/5] Cai dat backend dependencies (bao gom bcryptjs)...
cd backend
call npm install
if %errorlevel% neq 0 ( echo [LOI] npm install backend that bai & pause & exit /b 1 )

:: Prisma migrate
echo.
echo [2/5] Tao / cap nhat co so du lieu...
call npx prisma migrate dev --name add_new_modules --skip-seed
if %errorlevel% neq 0 (
    echo Thu reset DB va tao lai...
    call npx prisma migrate reset --force --skip-seed
)
call npx prisma generate

:: Install frontend
echo.
echo [3/5] Cai dat frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 ( echo [LOI] npm install frontend that bai & pause & exit /b 1 )

echo.
echo [4/5] Lay dia chi IP may tinh...
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%A
    goto :found_ip
)
:found_ip
set IP=%IP: =%
echo [OK] IP may tinh: %IP%

echo.
echo [5/5] Khoi dong ung dung...
cd ..

echo.
echo ====================================================
echo   Cai dat thanh cong!
echo   Backend : http://localhost:3001
echo   Frontend: http://localhost:5173
echo   LAN     : http://%IP%:5173
echo ====================================================
echo.

start "Backend - BST Manager" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 > nul
start "Frontend - BST Manager" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 5 > nul
start http://localhost:5173

echo [DONE] Ung dung da chay!
echo Truy cap LAN: http://%IP%:5173
pause
