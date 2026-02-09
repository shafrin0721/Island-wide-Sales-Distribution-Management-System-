# Test authentication endpoints
$baseUrl = "http://localhost:5000"

Write-Host "Test 1: Registration"
$regBody = @{
    email = "final@example.com"
    password = "password123"
    full_name = "Final Test"
    phone = "+1234567890"
    role = "customer"
} | ConvertTo-Json

$regResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body $regBody -UseBasicParsing
Write-Host "Status: $($regResponse.StatusCode)"
$regData = $regResponse.Content | ConvertFrom-Json
Write-Host "User registered: $($regData.success)"
$token = $regData.token
Write-Host "Token received"

Start-Sleep -Seconds 2

Write-Host "`nTest 2: Change Password"
$pwdBody = @{
    currentPassword = "password123"
    newPassword = "newpassword456"
} | ConvertTo-Json

$pwdResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/change-password" -Method POST -ContentType "application/json" -Body $pwdBody -Headers @{Authorization="Bearer $token"} -UseBasicParsing
Write-Host "Status: $($pwdResponse.StatusCode)"
$pwdData = $pwdResponse.Content | ConvertFrom-Json
Write-Host "Password changed: $($pwdData.success)"
Write-Host "Message: $($pwdData.message)"
