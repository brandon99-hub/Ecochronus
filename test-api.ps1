# PowerShell test script for API endpoints
# Usage: .\test-api.ps1

$baseUrl = "http://localhost:3000"

Write-Host "=== Health Check ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$baseUrl/health" -Method Get | ConvertTo-Json

# Function to generate nonce and timestamp for replay protection
function Get-ReplayHeaders {
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $nonce = "$timestamp-$([System.Guid]::NewGuid().ToString())"
    return @{
        "X-Nonce" = $nonce
        "X-Timestamp" = $timestamp.ToString()
    }
}

Write-Host "`n=== Signup ===" -ForegroundColor Green
$signupBody = @{
    email = "test@example.com"
    username = "testuser"
    password = "testpassword123"
} | ConvertTo-Json

$signupHeaders = Get-ReplayHeaders

try {
    $signupResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json" -Headers $signupHeaders
    $signupResponse | ConvertTo-Json -Depth 5
    
    $accessToken = $signupResponse.data.accessToken
    $refreshToken = $signupResponse.data.refreshToken
} catch {
    Write-Host "Signup failed, trying login..." -ForegroundColor Yellow
    
    Write-Host "`n=== Login ===" -ForegroundColor Green
    $loginBody = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json
    
    $loginHeaders = Get-ReplayHeaders
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -Headers $loginHeaders
    $loginResponse | ConvertTo-Json -Depth 5
    
    $accessToken = $loginResponse.data.accessToken
    $refreshToken = $loginResponse.data.refreshToken
}

if ($accessToken) {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }
    
    Write-Host "`n=== Get Profile ===" -ForegroundColor Green
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Get -Headers $headers | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Write-Host "`n=== List Missions ===" -ForegroundColor Green
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/missions" -Method Get -Headers $headers | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Write-Host "`n=== Get Rewards ===" -ForegroundColor Green
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/rewards" -Method Get -Headers $headers | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Write-Host "`n=== Test Starting a Mission ===" -ForegroundColor Green
    # First, we need a mission ID - let's try to get one from the missions list
    try {
        $missionsResponse = Invoke-RestMethod -Uri "$baseUrl/api/missions" -Method Get -Headers $headers
        if ($missionsResponse.data.missions -and $missionsResponse.data.missions.Count -gt 0) {
            $missionId = $missionsResponse.data.missions[0].id
            $startMissionHeaders = $headers.Clone()
            $replayHeaders = Get-ReplayHeaders
            foreach ($key in $replayHeaders.Keys) {
                $startMissionHeaders[$key] = $replayHeaders[$key]
            }
            $startResponse = Invoke-RestMethod -Uri "$baseUrl/api/missions/$missionId/start" -Method Post -Headers $startMissionHeaders
            $startResponse | ConvertTo-Json -Depth 5
        } else {
            Write-Host "No missions available. Create a mission in the database first." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to get access token" -ForegroundColor Red
}

