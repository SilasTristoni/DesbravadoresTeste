param(
    [string]$BaseUrl = $env:BASE_URL,
    [string]$Username = $(if ($env:SMOKE_USERNAME) { $env:SMOKE_USERNAME } else { "adm" }),
    [string]$Password = $(if ($env:SMOKE_PASSWORD) { $env:SMOKE_PASSWORD } else { "adm123" })
)

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = "http://localhost:8080"
}

$BaseUrl = $BaseUrl.TrimEnd("/")

function Invoke-SmokeRequest {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers = @{},
        $Body = $null
    )

    $uri = "$BaseUrl$Path"
    try {
        if ($null -ne $Body) {
            return Invoke-WebRequest -Method $Method -Uri $uri -Headers $Headers -Body $Body -ContentType "application/json" -UseBasicParsing
        }

        return Invoke-WebRequest -Method $Method -Uri $uri -Headers $Headers -UseBasicParsing
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        throw "Smoke test failed: $Method $Path returned HTTP $status"
    }
}

Write-Host "Smoke test target: $BaseUrl"

Invoke-SmokeRequest -Method GET -Path "/login.html" | Out-Null
Write-Host "OK GET /login.html"

Invoke-SmokeRequest -Method GET -Path "/admin.html" | Out-Null
Write-Host "OK GET /admin.html"

$loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
$loginResponse = Invoke-SmokeRequest -Method POST -Path "/auth/login" -Body $loginBody
$token = ($loginResponse.Content | ConvertFrom-Json).token

if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Smoke test failed: login did not return token"
}

Write-Host "OK POST /auth/login"

$authHeaders = @{ Authorization = "Bearer $token" }

Invoke-SmokeRequest -Method GET -Path "/api/admin/users/monitors?page=0&size=999" -Headers $authHeaders | Out-Null
Write-Host "OK GET /api/admin/users/monitors"

Invoke-SmokeRequest -Method GET -Path "/api/admin/users?page=0&size=5&sort=name,asc" -Headers $authHeaders | Out-Null
Write-Host "OK GET /api/admin/users"

Write-Host "Smoke test passed."
