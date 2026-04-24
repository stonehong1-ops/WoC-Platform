import json
import os

log_path = r'C:\Users\stone\.gemini\antigravity\brain\5f8a0a1f-7364-4fb4-817c-3872396b4283\.system_generated\logs\overview.txt'
output_path = r'C:\Users\stone\WoC\scratch\user_html_final.txt'

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

found = False
for line in reversed(lines):
    if '"source":"USER"' in line and 'Calendar View' in line:
        try:
            data = json.loads(line)
            text = data.get('text', '')
            if '<!DOCTYPE html>' in text:
                with open(output_path, 'w', encoding='utf-8') as out:
                    out.write(text)
                print(f"Success: Found and saved to {output_path}")
                found = True
                break
        except Exception as e:
            print(f"JSON parse error on a line: {e}")
            continue

if not found:
    print("Failed to find the HTML in the logs.")
