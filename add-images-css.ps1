# Add images.css to all HTML pages
$htmlFiles = @(
    "pages/customer/cart.html",
    "pages/customer/checkout.html",
    "pages/customer/orders.html",
    "pages/customer/profile.html",
    "pages/customer/settings.html",
    "pages/customer/support.html",
    "pages/customer/track-delivery.html",
    "pages/admin/dashboard.html",
    "pages/admin/products.html",
    "pages/admin/reports.html",
    "pages/admin/settings.html",
    "pages/admin/users.html",
    "pages/rdc/dashboard.html",
    "pages/rdc/delivery.html",
    "pages/rdc/inventory.html",
    "pages/rdc/orders.html",
    "forgot-password.html",
    "notifications.html"
)

$appPath = "d:\top up\Advance Software Engineerinh\APP\"

foreach ($file in $htmlFiles) {
    $filePath = Join-Path $appPath $file
    
    if (-not (Test-Path $filePath)) {
        Write-Host "File not found: $filePath"
        continue
    }
    
    $content = Get-Content $filePath -Raw
    
    # Check if images.css already added
    if ($content -notmatch 'images.css') {
        # Determine path prefix
        $pathPrefix = if ($file -like 'pages/*') { '../../' } else { '' }
        $cssLink = "    <link rel=`"stylesheet`" href=`"${pathPrefix}css/images.css`" />"
        
        # Add images.css after footer.css line
        $content = $content -replace '(footer.css.*>)', "`$1`n$cssLink"
        
        Set-Content $filePath $content -Encoding UTF8
        Write-Host "Updated: $file"
    }
}

Write-Host "Done!"
