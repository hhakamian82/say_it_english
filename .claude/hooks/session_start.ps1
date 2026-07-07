# SessionStart hook — تزریق خودکار hooshbrain (حافظهٔ مرکزی) به ابتدای هر session
# stdout این hook مستقیم وارد context مدل می‌شود.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# pull خود ریپو (ADR-008 — گردش کار دو دستگاهی): ff-only، بدون prompt، بی‌صدا در حالت عادی
$env:GIT_TERMINAL_PROMPT = '0'
$pullOut = git pull --ff-only 2>&1
if ($LASTEXITCODE -ne 0) { Write-Output "⚠️ git pull این repo ناموفق بود — قبل از ادامه دستی بررسی کن" }
elseif ("$pullOut" -notmatch 'Already up to date') { Write-Output "✅ repo با GitHub همگام شد (git pull)" }

$hb = $env:HOOSHBRAIN
if (-not $hb) { $hb = 'D:\HH\agent\web\hoshak\hooshbrain' }
if (-not (Test-Path $hb)) { exit 0 }

Write-Output '# hooshbrain — حافظهٔ مرکزی اکوسیستم آیناب (تزریق خودکار SessionStart)'
$idx = Join-Path $hb 'MEMORY.md'
if (Test-Path $idx) { Get-Content $idx -Encoding UTF8 }

# پیام‌های خوانده‌نشدهٔ bus → تزریق + انتقال به آرشیو
$inbox = Join-Path $hb 'bus\inbox-main.md'
if (Test-Path $inbox) {
    $msgs = @(Get-Content $inbox -Encoding UTF8 | Where-Object { $_.Trim() -and -not $_.StartsWith('#') -and -not $_.StartsWith('<!--') })
    if ($msgs.Count -gt 0) {
        Write-Output ''
        Write-Output '## پیام‌های خوانده‌نشدهٔ bus (از ایجنت‌ها / سشن‌های قبلی)'
        $msgs | Write-Output
        Add-Content -Path (Join-Path $hb 'bus\archive.log') -Value $msgs -Encoding UTF8
        Set-Content -Path $inbox -Value '# inbox-main — صندوق پیام برای session بعدی' -Encoding UTF8
    }
}

# چند رویداد آخر اکوسیستم (کارهایی که ایجنت‌ها در سشن‌های دیگر کرده‌اند)
$ev = Join-Path $hb 'bus\events.log'
if (Test-Path $ev) {
    $tail = @(Get-Content $ev -Encoding UTF8 -Tail 8 | Where-Object { $_.Trim() })
    if ($tail.Count -gt 0) {
        Write-Output ''
        Write-Output '## آخرین رویدادهای ثبت‌شدهٔ ایجنت‌ها (bus/events.log)'
        $tail | Write-Output
    }
}
exit 0
