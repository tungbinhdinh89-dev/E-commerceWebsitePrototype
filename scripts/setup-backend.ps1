param([switch]$SkipMySql, [switch]$InstallLocalMySql)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $projectRoot '.tools'
$downloadsRoot = Join-Path $toolsRoot 'downloads'
New-Item -ItemType Directory -Force -Path $downloadsRoot | Out-Null

function Get-VerifiedDownload($Uri, $Destination, $Algorithm, $Checksum) {
    if (-not (Test-Path -LiteralPath $Destination)) {
        Write-Host "Downloading $([IO.Path]::GetFileName($Destination))..."
        Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $Destination -TimeoutSec 600
    }
    if ((Get-FileHash -LiteralPath $Destination -Algorithm $Algorithm).Hash -ne $Checksum) {
        throw "Checksum mismatch: $Destination. Remove this archive and retry."
    }
}

function Assert-ToolsPath($CandidatePath) {
    $absolutePath = [IO.Path]::GetFullPath($CandidatePath)
    $allowedPrefix = [IO.Path]::GetFullPath($toolsRoot) + [IO.Path]::DirectorySeparatorChar
    if (-not $absolutePath.StartsWith($allowedPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Tool destination is outside the project .tools directory.'
    }
}

$phpRoot = Join-Path $toolsRoot 'php'
$phpExecutable = Join-Path $phpRoot 'php.exe'
if (-not (Test-Path -LiteralPath $phpExecutable)) {
    $releases = Invoke-RestMethod -Uri 'https://downloads.php.net/~windows/releases/releases.json' -TimeoutSec 30
    $release = $releases.'8.3'
    $build = $release.'nts-vs16-x64'.zip
    if ($build.path -notmatch '^php-8\.3\.\d+-nts-Win32-vs16-x64\.zip$' -or -not $build.sha256) {
        throw 'PHP 8.3 NTS x64 download metadata unavailable.'
    }
    $archive = Join-Path $downloadsRoot $build.path
    Get-VerifiedDownload "https://downloads.php.net/~windows/releases/$($build.path)" $archive 'SHA256' $build.sha256
    Write-Host 'Extracting PHP 8.3...'
    Expand-Archive -LiteralPath $archive -DestinationPath $phpRoot -Force
}
$phpIni = Join-Path $phpRoot 'php.ini'
$certificatePath = Join-Path $toolsRoot 'cacert.pem'
if (-not (Test-Path -LiteralPath $certificatePath)) {
    Invoke-WebRequest -UseBasicParsing -Uri 'https://curl.se/ca/cacert.pem' -OutFile $certificatePath -TimeoutSec 30
}
if (-not (Test-Path -LiteralPath $phpIni)) {
    $iniContent = Get-Content -LiteralPath (Join-Path $phpRoot 'php.ini-development') -Raw
    $extensionRoot = (Join-Path $phpRoot 'ext').Replace('\', '/')
    $iniContent = $iniContent.Replace(';extension_dir = "ext"', "extension_dir = `"$extensionRoot`"")
    foreach ($extension in @('curl', 'fileinfo', 'mbstring', 'openssl', 'pdo_mysql')) {
        $iniContent = $iniContent.Replace(";extension=$extension", "extension=$extension")
    }
    $certificateIniPath = $certificatePath.Replace('\', '/')
    $iniContent += "`ncurl.cainfo = `"$certificateIniPath`"`nopenssl.cafile = `"$certificateIniPath`"`n"
    [IO.File]::WriteAllText($phpIni, $iniContent, [Text.UTF8Encoding]::new($false))
}
& $phpExecutable --version
if ($LASTEXITCODE -ne 0) { throw 'PHP could not start. Install the Microsoft Visual C++ 2015-2022 x64 runtime.' }

$composerPath = Join-Path $toolsRoot 'composer.phar'
if (-not (Test-Path -LiteralPath $composerPath)) {
    $installerPath = Join-Path $downloadsRoot 'composer-setup.php'
    $installerHash = (Invoke-RestMethod -Uri 'https://composer.github.io/installer.sig' -TimeoutSec 30).Trim()
    Get-VerifiedDownload 'https://getcomposer.org/installer' $installerPath 'SHA384' $installerHash
    & $phpExecutable $installerPath "--install-dir=$toolsRoot" '--filename=composer.phar' '--2' '--quiet'
    if ($LASTEXITCODE -ne 0) { throw 'Composer installation failed.' }
}
& $phpExecutable $composerPath install --working-dir="$projectRoot/backend" --no-interaction
if ($LASTEXITCODE -ne 0) { throw 'Composer install failed.' }

if ($InstallLocalMySql -and -not $SkipMySql) {
    $mysqlRoot = Join-Path $toolsRoot 'mysql'
    if (-not (Test-Path -LiteralPath (Join-Path $mysqlRoot 'bin/mysqld.exe'))) {
        $downloadPage = (Invoke-WebRequest -UseBasicParsing -Uri 'https://dev.mysql.com/downloads/mysql/8.4.html' -TimeoutSec 30).Content
        $archiveMatch = [regex]::Match($downloadPage, '(mysql-8\.4\.\d+-winx64\.zip).*?MD5:\s*<code\b[^>]*>\s*([a-f0-9]{32})', 'Singleline')
        if (-not $archiveMatch.Success) { throw 'MySQL 8.4 ZIP/checksum metadata unavailable. See dev.mysql.com/downloads/mysql/8.4.html.' }
        $archiveName = $archiveMatch.Groups[1].Value
        $archive = Join-Path $downloadsRoot $archiveName
        Get-VerifiedDownload "https://cdn.mysql.com/Downloads/MySQL-8.4/$archiveName" $archive 'MD5' $archiveMatch.Groups[2].Value
        Write-Host 'Extracting MySQL 8.4 (this may take a few minutes)...'
        Expand-Archive -LiteralPath $archive -DestinationPath $toolsRoot -Force
        $extractedRoot = Join-Path $toolsRoot ([IO.Path]::GetFileNameWithoutExtension($archiveName))
        Assert-ToolsPath $extractedRoot
        Assert-ToolsPath $mysqlRoot
        Move-Item -LiteralPath $extractedRoot -Destination $mysqlRoot
    }
    & (Join-Path $mysqlRoot 'bin/mysqld.exe') --version
}
Write-Host 'Tools installed locally in .tools/. No global PATH or XAMPP settings were changed.'
Write-Host 'Next: npm run backend:init, npm run backend:migrate, npm run backend:seed, npm run dev:backend'
