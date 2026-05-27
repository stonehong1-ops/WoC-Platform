import json
import os

log_path = r'C:\Users\stone\.gemini\antigravity\brain\5aef59ee-8019-48a7-9bcb-aa09283fa701\.system_generated\logs\overview.txt'
output_path = r'c:\Users\stone\WoC\extracted_html.html'

target_line_num = 248

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == target_line_num - 1:
            data = json.loads(line)
            content = data['content']
            # The content might have <USER_REQUEST> tags or similar
            # Based on view_file output: "<USER_REQUEST>\n<!DOCTYPE html>..."
            if '<USER_REQUEST>' in content:
                content = content.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0].strip()
            
            with open(output_path, 'w', encoding='utf-8') as out_f:
                out_f.write(content)
            print(f"Extracted to {output_path}")
            break
