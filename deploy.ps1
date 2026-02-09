# Firebase Hosting Deployment - PowerShell Script for Windows
# Run as: powershell .\deploy.ps1

Write-Host "🚀 ISDN System - Firebase Hosting Deployment" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Step 1: Check Firebase CLI
Write-Host "`n📋 Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $version = firebase --version 2>$null
    Write-Host "✓ Firebase CLI found: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ Firebase CLI not found" -ForegroundColor Red
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check Firebase login
Write-Host "`n📋 Step 2: Checking Firebase login..." -ForegroundColor Yellow
$loginCheck = firebase projects:list 2>&1 | Select-String "projects" | Measure-Object
if ($loginCheck.Count -eq 0) {
    Write-Host "Logging in to Firebase..." -ForegroundColor Yellow
    firebase login
} else {
    Write-Host "✓ Already logged in to Firebase" -ForegroundColor Green
}

# Step 3: Verify project
Write-Host "`n📋 Step 3: Verifying Firebase project..." -ForegroundColor Yellow
firebase use isdn-6291c
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Project set to isdn-6291c" -ForegroundColor Green
}

# Step 4: Check configuration files
Write-Host "`n📋 Step 4: Checking configuration files..." -ForegroundColor Yellow
$filesOk = $true
if (Test-Path "firebase.json") {
    Write-Host "✓ firebase.json found" -ForegroundColor Green
} else {
    Write-Host "✗ firebase.json not found" -ForegroundColor Red
    $filesOk = $false
}

if (Test-Path ".firebaseignore") {
    Write-Host "✓ .firebaseignore found" -ForegroundColor Green
} else {
    Write-Host "✗ .firebaseignore not found" -ForegroundColor Red
    $filesOk = $false
}

if (-not $filesOk) {
    exit 1
}

# Step 5: Clean up test files
Write-Host "`n📋 Step 5: Cleaning up test files..." -ForegroundColor Yellow
Get-Item "test-*.html" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "✓ Test files cleaned" -ForegroundColor Green

# Step 6: Show what will be deployed
Write-Host "`n📋 Step 6: Preview files to be deployed..." -ForegroundColor Yellow
Write-Host "Key files:" -ForegroundColor Cyan
Get-ChildItem -File -Recurse | `
    Where-Object { 
        $_.Name -notmatch '\.md$' -and 
        $_.FullName -notmatch 'node_modules' -and 
        $_.FullName -notmatch 'backend' -and 
        $_.FullName -notmatch '\.git' -and 
        $_.Name -notmatch '^test-'
    } | Select-Object -First 15 | `
    ForEach-Object { Write-Host "  - $($_.Name)" }
Write-Host "  ... and more files" -ForegroundColor Cyan

# Step 7: Deploy
Write-Host "`n📋 Step 7: Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Deployment successful!" -ForegroundColor Green
    Write-Host "`n🎉 Your ISDN system is now live:" -ForegroundColor Green
    Write-Host "📍 https://isdn-6291c.web.app" -ForegroundColor Cyan
    Write-Host "📍 https://isdn-6291c.firebaseapp.com" -ForegroundColor Cyan
    Write-Host "`nView Firebase Console:" -ForegroundColor Green
    Write-Host "📊 https://console.firebase.google.com/project/isdn-6291c" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
