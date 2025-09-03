@echo off
setlocal

if "%1"=="" (
    echo Usage: release.bat ^<version^>
    exit /b 1
)

set VERSION=%1

echo Starting release %VERSION%...

git flow release start %VERSION%

cd frontend
npm version %VERSION% --no-git-tag-version
cd ..

echo # Version %VERSION% > VERSION

git add .
git commit -m "Bump version to %VERSION%"

git flow release finish %VERSION%

git push origin main
git push origin develop
git push --tags

echo Release %VERSION% completed!