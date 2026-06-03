@echo off
chcp 65001 > nul
title Prisma Migration
color 0B
echo.
echo ========================================
echo  Dang cap nhat co so du lieu...
echo ========================================
echo.
cd /d %~dp0backend

echo [1/3] Chay migration...
node node_modules\.bin\prisma migrate dev --name add_image_nhomhang_sizes --skip-seed
if %errorlevel% neq 0 (
    echo.
    echo [!] Migration that bai. Thu reset...
    node node_modules\.bin\prisma migrate reset --force --skip-seed
)

echo.
echo [2/3] Tao lai Prisma Client...
node node_modules\.bin\prisma generate

echo.
echo [3/3] Xong!
echo Co so du lieu da duoc cap nhat.
echo.
echo Nhan phim bat ky de dong...
pause > nul
