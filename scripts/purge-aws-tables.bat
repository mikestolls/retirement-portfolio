@echo off
REM Purge AWS DynamoDB tables safely with confirmations
REM This script deletes ALL data from your DynamoDB tables
REM Usage: purge-aws-tables.bat [--profile profile-name]

set PROFILE_ARG=
if "%1"=="--profile" (
    if "%2"=="" (
        echo Error: --profile requires a profile name
        echo Usage: purge-aws-tables.bat [--profile profile-name]
        pause
        exit /b 1
    )
    set PROFILE_ARG=--profile %2
)

echo.
echo ==========================================
echo    AWS DynamoDB Table Purge Tool
echo ==========================================
echo.
if defined PROFILE_ARG (
    echo Using AWS Profile: %2
    echo.
)
echo This script will DELETE ALL DATA from your DynamoDB tables:
echo   - users
echo   - families  
echo   - retirement_funds
echo   - budgets
echo.
echo Make sure you want to do this before proceeding!
echo.

cd /d "%~dp0.."
cd backend

python ..\scripts\purge-aws-tables.py %PROFILE_ARG%

echo.
pause