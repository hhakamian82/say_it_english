# Stop hook — «دروازهٔ پایان»: اگر فایل‌هایی تغییر کرده ولی چرخهٔ بازبینی/حافظه اجرا نشده،
# پایان session را یک بار block می‌کند و از مدل می‌خواهد reviewer و hooshbrain-keeper را اجرا کند.
# ضد حلقه: (۱) چک stop_hook_active  (۲) صف بعد از block خالی می‌شود.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$raw = [Console]::In.ReadToEnd()
try { $in = $raw | ConvertFrom-Json } catch { exit 0 }
if ($in.stop_hook_active -eq $true) { exit 0 }

$hb = $env:HOOSHBRAIN
if (-not $hb) { $hb = 'D:\HH\agent\web\hoshak\hooshbrain' }
$repo = Split-Path -Leaf (Get-Location)
$log = Join-Path $hb "bus\$repo\pending_changes.log"
if (-not (Test-Path $log)) { exit 0 }

$lines = @(Get-Content $log -Encoding UTF8 | Where-Object { $_.Trim() })
if ($lines.Count -eq 0) { exit 0 }

$files = @($lines | ForEach-Object { ($_ -split "`t")[-1] } | Sort-Object -Unique)
# انتقال صف به آرشیو تا Stop بعدی آزاد باشد
Add-Content -Path (Join-Path $hb "bus\$repo\reviewed.log") -Value $lines -Encoding UTF8
Set-Content -Path $log -Value '' -Encoding UTF8

$list = ($files | Select-Object -First 20) -join '؛ '
$reason = "پیش از پایان session، $($files.Count) فایل تغییر کرده و چرخهٔ بازبینی/حافظه هنوز اجرا نشده: $list — الان به ترتیب: (۱) ایجنت reviewer را با همین لیست فایل‌ها اجرا کن. (۲) ایجنت hooshbrain-keeper را با خلاصهٔ کارها و تصمیم‌های این session اجرا کن. (۳) فقط اگر reviewer مشکل اساسی گزارش کرد (باگ امنیتی/از دست رفتن داده/تضاد با ADR یا بلوپرینت) با AskUserQuestion از کاربر بپرس؛ در غیر این صورت هیچ سوالی نپرس و بعد از این دو ایجنت، session را تمام کن."

@{ decision = 'block'; reason = $reason } | ConvertTo-Json -Compress
exit 0
