$content = Get-Content -Path 'C:\Users\stone\.gemini\antigravity\brain\5f8a0a1f-7364-4fb4-817c-3872396b4283\.system_generated\logs\overview.txt' -Encoding UTF8
$startIndex = -1
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -like '*"source":"USER"*' -and $content[$i] -like '*Freestyle Tango - Calendar View*') {
        $startIndex = $i
    }
}

if ($startIndex -ge 0) {
    $content[$startIndex] | Out-File -FilePath 'C:\Users\stone\WoC\scratch\user_html_log.json' -Encoding UTF8
}
