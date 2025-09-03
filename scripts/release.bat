@echo off
setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: release.bat ^<version^>
    exit /b 1
)

set VERSION=%1

echo Starting release %VERSION%...

REM Check if on develop branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if not "!CURRENT_BRANCH!"=="develop" (
    echo Switching to develop branch...
    git checkout develop
    if errorlevel 1 (
        echo Error: Could not switch to develop branch
        exit /b 1
    )
)

REM Start release
git flow release start %VERSION%
if errorlevel 1 (
    echo Error: Could not start release
    exit /b 1
)

REM Update frontend version
cd frontend
npm version %VERSION% --no-git-tag-version
if errorlevel 1 (
    echo Error: Could not update frontend version
    cd ..
    exit /b 1
)
cd ..

REM Create version file
echo # Version %VERSION% > VERSION

REM Commit changes
git add .
git commit -m "Bump version to %VERSION%"
if errorlevel 1 (
    echo Error: Could not commit version changes
    exit /b 1
)

REM Finish release (this will prompt for merge commit messages)
echo Finishing release - you may be prompted for commit messages...
git flow release finish %VERSION%
if errorlevel 1 (
    echo Error: Could not finish release
    exit /b 1
)

REM Push everything
echo Pushing to remote...
git push origin main
git push origin develop
git push --tags

echo Release %VERSION% completed successfully!