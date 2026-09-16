@echo off
title WorkshopOS
echo.
echo WorkshopOS - Car Workshop Management
echo ================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js 20+ and run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)
echo Starting WorkshopOS...
call npm run dev
pause
