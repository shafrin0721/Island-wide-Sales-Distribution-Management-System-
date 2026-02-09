# PowerShell Script to Add Footer to All HTML Pages
# This script adds footer CSS and footer-loader.js to all relevant HTML files

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

# CSS link to add
$cssLink = '    <link rel="stylesheet" href="../../css/footer.css" />'
$faLink = '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />'

# Footer loader script
$footerScript = '    <script src="../../js/footer-loader.js"></script>'

foreach ($file in $htmlFiles) {
    $filePath = Join-Path $appPath $file
    
    if (-not (Test-Path $filePath)) {
        Write-Host "File not found: $filePath"
        continue
    }
    
    $content = Get-Content $filePath -Raw
    
    # Check if footer CSS already added
    if ($content -notmatch 'footer\.css') {
        # Add CSS after styles.css line
        if ($file -like "pages/*") {
            $cssInsert = '    <link rel="stylesheet" href="../../css/footer.css" />'
            $faInsert = '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />'
        } else {
            $cssInsert = '    <link rel="stylesheet" href="css/footer.css" />'
            $faInsert = '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />'
        }
        
        $content = $content -replace '(link rel="stylesheet" href="[^"]*styles\.css"[^>]*>)', "`$1`n$cssInsert`n$faInsert"
    }
    
    # Check if footer script already added
    if ($content -notmatch 'footer-loader\.js') {
        # Add footer loader before closing body tag
        if ($file -like "pages/*") {
            $scriptInsert = '    <script src="../../js/footer-loader.js"></script>'
        } else {
            $scriptInsert = '    <script src="js/footer-loader.js"></script>'
        }
        
        $content = $content -replace '(\s*)</body>', "`n$scriptInsert`n  </body>"
    }
    
    Set-Content $filePath $content -Encoding UTF8
    Write-Host "Updated: $file"
}

Write-Host "Footer addition complete!"
