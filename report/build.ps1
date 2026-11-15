# Self-contained LuaLaTeX build. Full logs are retained by build.py.
$ErrorActionPreference = 'Stop'
$texLiveBin = 'C:\texlive\2026\bin\windows'
if (-not (Get-Command latexmk -ErrorAction SilentlyContinue)) {
    if (Test-Path -LiteralPath (Join-Path $texLiveBin 'latexmk.exe')) {
        $env:Path = $texLiveBin + ';' + $env:Path
    } else {
        throw 'TeX Live with LuaLaTeX, latexmk and Biber is required.'
    }
}
$oldReportLocale = $env:LC_ALL
$oldReportLang = $env:LANG
try {
    $env:LC_ALL = 'C'
    $env:LANG = 'C'
    & python (Join-Path $PSScriptRoot 'build.py') --tex (Join-Path $PSScriptRoot 'main.tex') --engine lualatex @args
    $reportBuildExitCode = $LASTEXITCODE
} finally {
    $env:LC_ALL = $oldReportLocale
    $env:LANG = $oldReportLang
}
if ($reportBuildExitCode -ne 0) { exit $reportBuildExitCode }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'dist/main.pdf') -Destination (Join-Path $PSScriptRoot 'main.pdf')
