param([Parameter(Mandatory=$true)][string]$BaseUrl,[Parameter(Mandatory=$true)][string]$AnonKey)
$portal = Invoke-WebRequest "$BaseUrl/functions/v1/portal"
if ($portal.Content -notmatch "NuroSpark Market OS") { throw "Portal smoke test failed" }
Invoke-RestMethod "$BaseUrl/functions/v1/crm/leads" -Headers @{apikey=$AnonKey}
Invoke-RestMethod "$BaseUrl/functions/v1/ai-growth/content" -Method POST -Headers @{apikey=$AnonKey;"content-type"="application/json"} -Body '{"type":"Instagram Caption"}'
Invoke-RestMethod "$BaseUrl/functions/v1/social-os/providers" -Headers @{apikey=$AnonKey}
Write-Host "Smoke tests passed."
