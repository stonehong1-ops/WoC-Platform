import json
import os

log_path = r'C:\Users\stone\.gemini\antigravity\brain\5f8a0a1f-7364-4fb4-817c-3872396b4283\.system_generated\logs\overview.txt'
output_path = r'C:\Users\stone\WoC\scratch\user_html.txt'

found_html = ""

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('source') == 'USER':
                text = data.get('text', '')
                if 'Freestyle Tango - Calendar View' in text:
                    found_html = text
        except:
            continue

if found_html:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(found_html)
    print(f"Successfully extracted HTML to {output_path}")
else:
    print("Could not find USER message with HTML.")
