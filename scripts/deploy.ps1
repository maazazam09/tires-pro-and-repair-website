# Tire Pro and Repair — Vercel Deployment Script
# Run from D:\grok: powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1

Write-Host "=== Tire Pro and Repair — Deploy to Vercel ===" -ForegroundColor Cyan

# Step 1: Vercel login (opens browser)
Write-Host "`n[1/4] Logging into Vercel..." -ForegroundColor Yellow
cmd /c "npx vercel login"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 2: Turso database setup
Write-Host "`n[2/4] Setting up Turso database (free, serverless SQLite)..." -ForegroundColor Yellow
Write-Host "If not logged in to Turso, run: npx turso auth login" -ForegroundColor Gray
$dbName = "tirepro-chico"
cmd /c "npx turso db create $dbName 2>nul"
cmd /c "npx turso db show $dbName --url"
cmd /c "npx turso db tokens create $dbName"

Write-Host "`nCopy the URL and token above, then set Vercel env vars:" -ForegroundColor Yellow
Write-Host "  TURSO_DATABASE_URL = libsql://..." -ForegroundColor White
Write-Host "  TURSO_AUTH_TOKEN   = eyJ..." -ForegroundColor White
Write-Host "  AUTH_SECRET        = (run: openssl rand -base64 32)" -ForegroundColor White
Write-Host "  NEXTAUTH_URL       = https://your-domain.vercel.app" -ForegroundColor White
Write-Host "  ADMIN_EMAIL        = admin@tireproandrepair.com" -ForegroundColor White
Write-Host "  ADMIN_PASSWORD     = (your secure password)" -ForegroundColor White

$continue = Read-Host "`nHave you set env vars in Vercel dashboard? (y/n)"
if ($continue -ne "y") {
    Write-Host "Set env vars at: https://vercel.com/dashboard -> Project -> Settings -> Environment Variables" -ForegroundColor Yellow
    Write-Host "Then re-run this script." -ForegroundColor Yellow
    exit 0
}

# Step 3: Deploy
Write-Host "`n[3/4] Deploying to Vercel..." -ForegroundColor Yellow
cmd /c "npx vercel deploy --prod --yes"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 4: Seed production database
Write-Host "`n[4/4] Seeding production database..." -ForegroundColor Yellow
Write-Host "Run locally with production env vars:" -ForegroundColor Gray
Write-Host "  `$env:TURSO_DATABASE_URL='...'; `$env:TURSO_AUTH_TOKEN='...'; npm run db:seed" -ForegroundColor White

Write-Host "`n=== Deploy complete! ===" -ForegroundColor Green
Write-Host "Admin: https://your-site.vercel.app/admin/login" -ForegroundColor Cyan