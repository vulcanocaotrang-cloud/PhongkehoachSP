@echo off
title Khoi dong BST Manager
echo Dang mo BST Manager...

start "BACKEND" cmd /k "cd /d %~dp0backend && node src/index.js"
ping 127.0.0.1 -n 4 > nul

start "FRONTEND" cmd /k "cd /d %~dp0frontend && node_modules\.bin\vite"
ping 127.0.0.1 -n 5 > nul

start http://localhost:5173
echo Xong! App dang chay tai http://localhost:5173
