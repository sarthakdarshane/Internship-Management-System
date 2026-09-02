[CmdletBinding()]
param()

$services = @(
    @{ Name = "Auth"; Url = "http://localhost:5001/db-test" },
    @{ Name = "Internship"; Url = "http://localhost:5002/db-test" },
    @{ Name = "Task"; Url = "http://localhost:5003/health" },
    @{ Name = "Sentiment (Python VADER)"; Url = "http://localhost:5004/health" },
    @{ Name = "Evaluation"; Url = "http://localhost:5005/health" },
    @{ Name = "Report"; Url = "http://localhost:5006/health" }
)

$failed = $false
foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri $service.Url -TimeoutSec 5
        Write-Host "PASS  $($service.Name)"
    } catch {
        Write-Host "FAIL  $($service.Name): $($_.Exception.Message)" -ForegroundColor Red
        $failed = $true
    }
}

if ($failed) { exit 1 }
