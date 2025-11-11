@echo off
REM Debug deployment with DEBUG log level for detailed timing analysis

echo Starting DEBUG deployment for Retirement Portfolio...
echo This will deploy with DEBUG log level for detailed performance analysis.
echo.

REM Call the main deploy script with DEBUG log level
call "%~dp0deploy.bat" DEBUG