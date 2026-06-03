@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

title ARtrium - スマホで試す（ngrok）

call "%~dp0scripts\start-ngrok-editor.bat"
