@echo off
setlocal
cd /d "%~dp0"
set "SVG_EDITOR_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "SVG_EDITOR_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "node_modules\typescript\bin\tsc" (
  echo Dependencies are missing. Run npm install or pnpm install first.
  exit /b 1
)
"%SVG_EDITOR_NODE%" "node_modules\typescript\bin\tsc" -p tsconfig.json
if errorlevel 1 exit /b 1
"%SVG_EDITOR_NODE%" "dist\src\bootstrap\Main.js"
