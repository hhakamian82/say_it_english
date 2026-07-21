# PostToolUse(Edit|Write|...) hook — هر فایل تغییریافته را در صف بازبینی repo ثبت می‌کند.
# stop_gate.ps1 بعداً بر اساس همین صف، چرخهٔ reviewer + hooshbrain-keeper را اجبار می‌کند.
$raw = [Console]::In.ReadToEnd()
try { $in = $raw | ConvertFrom-Json } catch { exit 0 }

$fp = $in.tool_input.file_path
if (-not $fp) { $fp = $in.tool_input.notebook_path }
if (-not $fp) { exit 0 }
# تغییرات خود hooshbrain یا فایل‌های .claude وارد صف نمی‌شوند (جلوگیری از حلقه)
if ($fp -match 'hooshbrain' -or $fp -match '\.claude') { exit 0 }

$hb = $env:HOOSHBRAIN
if (-not $hb -or -not (Test-Path $hb)) { $d = (Get-Location).Path; while ($d -and -not (Test-Path (Join-Path $d 'system\hooshbrain'))) { $d = Split-Path $d -Parent }; if ($d) { $hb = Join-Path $d 'system\hooshbrain' } }
$repo = Split-Path -Leaf (Get-Location)
$dir = Join-Path $hb "bus\$repo"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Add-Content -Path (Join-Path $dir 'pending_changes.log') -Value ("{0}`t{1}" -f (Get-Date -Format 's'), $fp) -Encoding UTF8
exit 0
