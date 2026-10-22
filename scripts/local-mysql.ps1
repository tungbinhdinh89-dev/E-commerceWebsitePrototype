param([ValidateSet('init', 'start', 'stop')][string]$Action = 'start')

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $projectRoot '.tools'
$mysqlRoot = Join-Path $toolsRoot 'mysql'
$serverPath = Join-Path $mysqlRoot 'bin/mysqld.exe'
$clientPath = Join-Path $mysqlRoot 'bin/mysql.exe'
$adminPath = Join-Path $mysqlRoot 'bin/mysqladmin.exe'
$dataRoot = Join-Path $toolsRoot 'mysql-data'
$configPath = Join-Path $toolsRoot 'my.ini'
$credentialsPath = Join-Path $toolsRoot 'local-mysql.json'
$adminConfigPath = Join-Path $toolsRoot 'mysql-admin.cnf'
$envPath = Join-Path $projectRoot 'backend/.env'
$port = 13306

if (-not (Test-Path -LiteralPath $serverPath)) { throw 'MySQL 8.4 not installed. Run npm run backend:setup.' }

function Write-AdminConfig($Password) {
    [IO.File]::WriteAllText($adminConfigPath, "[client]`nhost=127.0.0.1`nport=$port`nuser=root`npassword=$Password`n", [Text.UTF8Encoding]::new($false))
}

function Start-LocalDatabase {
    $existingListener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($existingListener) {
        $runningExecutable = (Get-Process -Id $existingListener[0].OwningProcess -ErrorAction Stop).Path
        if ($runningExecutable -ne $serverPath) { throw "Port $port belongs to another process. No changes made." }
    } else {
        Start-Process -FilePath $serverPath -ArgumentList "--defaults-file=`"$configPath`"" -WindowStyle Hidden | Out-Null
    }
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        & $adminPath "--defaults-extra-file=$adminConfigPath" --connect-timeout=1 --silent ping 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'MySQL not ready. Inspect .tools/mysql-data/mysql-error.log locally.' }
}

if ($Action -eq 'init') {
    if (Test-Path -LiteralPath $credentialsPath) {
        Start-LocalDatabase
        Write-Host 'Local database already initialized; existing data/configuration preserved.'
        exit 0
    }
    if ((Test-Path -LiteralPath $envPath) -or (Test-Path -LiteralPath $dataRoot)) {
        throw 'Existing backend/.env or MySQL data found. Configure it manually; initialization will not overwrite it.'
    }
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Port $port is in use." }
    $basePath = $mysqlRoot.Replace('\', '/')
    $dataPath = $dataRoot.Replace('\', '/')
    $config = "[mysqld]`nbasedir=$basePath`ndatadir=$dataPath`nport=$port`nbind-address=127.0.0.1`nmysqlx=OFF`ncharacter-set-server=utf8mb4`ncollation-server=utf8mb4_0900_ai_ci`nlog-error=mysql-error.log`n"
    [IO.File]::WriteAllText($configPath, $config, [Text.UTF8Encoding]::new($false))
    Write-Host 'Initializing a new, isolated MySQL 8 database...'
    & $serverPath "--defaults-file=$configPath" --initialize-insecure
    if ($LASTEXITCODE -ne 0) { throw 'MySQL initialization failed.' }
    Write-AdminConfig ''
    Start-LocalDatabase
    $rootPassword = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $appPassword = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    "ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';" | & $clientPath "--defaults-extra-file=$adminConfigPath" --batch
    if ($LASTEXITCODE -ne 0) { throw 'Could not secure the new local root account.' }
    Write-AdminConfig $rootPassword
    $sql = @"
CREATE DATABASE computer_store CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE computer_store_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'techzone'@'127.0.0.1' IDENTIFIED BY '$appPassword';
GRANT ALL PRIVILEGES ON computer_store.* TO 'techzone'@'127.0.0.1';
GRANT ALL PRIVILEGES ON computer_store_test.* TO 'techzone'@'127.0.0.1';
"@
    # Passwords go through stdin, never command arguments or console output.
    $sql | & $clientPath "--defaults-extra-file=$adminConfigPath" --batch
    if ($LASTEXITCODE -ne 0) { throw 'Local database provisioning failed. Inspect the new local instance before retrying.' }
    $credentials = @{ port = $port; username = 'techzone'; database = 'computer_store' }
    [IO.File]::WriteAllText($credentialsPath, ($credentials | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    $environment = "APP_ENV=local`nAPP_DEBUG=false`nAPP_URL=http://localhost:8000`nDB_HOST=127.0.0.1`nDB_PORT=$port`nDB_DATABASE=computer_store`nDB_USERNAME=techzone`nDB_PASSWORD=$appPassword`n"
    [IO.File]::WriteAllText($envPath, $environment, [Text.UTF8Encoding]::new($false))
    Write-Host "Initialized computer_store and computer_store_test at 127.0.0.1:$port. Credentials saved in ignored local files."
} else {
    if (-not (Test-Path -LiteralPath $credentialsPath)) { throw 'Run npm run backend:init first.' }
    if ($Action -eq 'start') {
        Start-LocalDatabase
        Write-Host "MySQL 8 ready at 127.0.0.1:$port."
    } else {
        & $adminPath "--defaults-extra-file=$adminConfigPath" shutdown
        if ($LASTEXITCODE -ne 0) { throw 'MySQL shutdown failed.' }
        Write-Host 'Local MySQL stopped; database files preserved.'
    }
}
