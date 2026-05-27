param(
  [ValidateSet("next", "dev", "migrate", "db", "seed", "flask", "legacy", "help")]
  [string]$App = "next"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

function Write-Info {
  param([string]$Message)
  Write-Host $Message
}

function Stop-WithError {
  param([string]$Message)
  Write-Error $Message
  exit 1
}

function Test-Command {
  param([string]$Command)
  return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Ensure-Env {
  if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
      Copy-Item ".env.example" ".env"
      Write-Info "Created .env from .env.example. Review NEXTAUTH_SECRET before production use."
    } else {
      Stop-WithError ".env is missing and .env.example was not found."
    }
  }
}

function Ensure-Node {
  if (-not (Test-Command "npm")) {
    Stop-WithError "npm is not installed or not on PATH."
  }

  if (-not (Test-Command "npx")) {
    Stop-WithError "npx is not installed or not on PATH."
  }

  if (-not (Test-Path "node_modules")) {
    Write-Info "Installing npm dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
      Stop-WithError "npm install failed."
    }
  }
}

function Ensure-PrismaClient {
  Write-Info "Generating Prisma Client..."
  npx prisma generate
  if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Prisma Client generation failed."
  }
}

function Ensure-Database {
  Write-Info "Applying database migrations..."
  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Database migration failed. Run '.\launch.ps1 migrate' for interactive migration details."
  }
}

function Start-NextApp {
  Ensure-Env
  Ensure-Node
  Ensure-PrismaClient
  Ensure-Database

  Write-Info "Starting TripTally Next.js app at http://localhost:3000"
  npm run dev
}

function Start-Migration {
  Ensure-Env
  Ensure-Node
  Ensure-PrismaClient

  Write-Info "Running Prisma migrations..."
  npx prisma migrate dev
  if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Prisma migration failed."
  }
}

function Start-Seed {
  Ensure-Env
  Ensure-Node
  Ensure-PrismaClient

  Write-Info "Seeding demo data..."
  npm run seed
  if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Seed command failed."
  }
}

function Start-FlaskApp {
  $python = Get-Command "python3" -ErrorAction SilentlyContinue
  if (-not $python) {
    $python = Get-Command "python" -ErrorAction SilentlyContinue
  }

  if (-not $python) {
    Stop-WithError "Python is not installed or not on PATH."
  }

  if (-not (Test-Path "venv")) {
    Write-Info "Creating Python virtual environment..."
    & $python.Source -m venv venv
    if ($LASTEXITCODE -ne 0) {
      Stop-WithError "Could not create virtual environment."
    }
  }

  $activate = Join-Path $RootDir "venv\Scripts\Activate.ps1"
  if (-not (Test-Path $activate)) {
    Stop-WithError "Virtual environment activation script was not found."
  }

  . $activate

  if (Test-Path "requirements.txt") {
    Write-Info "Installing Python dependencies..."
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
      Stop-WithError "Python dependency install failed."
    }
  }

  Write-Info "Starting legacy Flask app..."
  python run.py
}

switch ($App) {
  "next" { Start-NextApp }
  "dev" { Start-NextApp }
  "migrate" { Start-Migration }
  "db" { Start-Migration }
  "seed" { Start-Seed }
  "flask" { Start-FlaskApp }
  "legacy" { Start-FlaskApp }
  "help" {
    Write-Host @"
Usage: .\launch.ps1 [next|migrate|seed|flask]

Commands:
  next      Start the Next.js app. Default.
  migrate   Run Prisma migrate dev.
  seed      Seed demo data.
  flask     Start the legacy Flask app.
"@
  }
}
