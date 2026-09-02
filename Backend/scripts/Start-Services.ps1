[CmdletBinding()]
param()

$backendRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $backendRoot "logs"
New-Item -ItemType Directory -Force $logDirectory | Out-Null

$services = @(
    @{ Name = "auth"; Port = 5001; Directory = "auth-service"; Executable = "node.exe"; Arguments = @("server.js") },
    @{ Name = "internship"; Port = 5002; Directory = "internship-service"; Executable = "node.exe"; Arguments = @("server.js") },
    @{ Name = "task"; Port = 5003; Directory = "task-service"; Executable = "node.exe"; Arguments = @("server.js") },
    @{ Name = "sentiment"; Port = 5004; Directory = "sentiment-service"; Executable = ".venv\\Scripts\\python.exe"; Arguments = @("app.py") },
    @{ Name = "evaluation"; Port = 5005; Directory = "evaluation-service"; Executable = "node.exe"; Arguments = @("server.js") },
    @{ Name = "report"; Port = 5006; Directory = "report-service"; Executable = "node.exe"; Arguments = @("server.js") }
)

foreach ($service in $services) {
    $servicePath = Join-Path $backendRoot "services\\$($service.Directory)"
    $listener = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
        Write-Host "$($service.Name) is already running on port $($service.Port)."
        continue
    }

    $executable = if ($service.Executable -eq "node.exe") { $service.Executable } else { Join-Path $servicePath $service.Executable }
    if (-not (Test-Path $executable -PathType Leaf) -and $service.Executable -ne "node.exe") {
        throw "Python environment missing for sentiment service. Run its setup from services\\sentiment-service\\README.md first."
    }

    $stdout = Join-Path $logDirectory "$($service.Name).out.log"
    $stderr = Join-Path $logDirectory "$($service.Name).err.log"
    $process = Start-Process -FilePath $executable -ArgumentList $service.Arguments -WorkingDirectory $servicePath -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    Write-Host "Started $($service.Name) on port $($service.Port) (process $($process.Id))."
}

Write-Host "Run .\\scripts\\Test-Services.ps1 after a few seconds to check each service."
