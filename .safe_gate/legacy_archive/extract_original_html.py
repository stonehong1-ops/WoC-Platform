import json
import os

log_path = r"C:\Users\stone\.gemini\antigravity\brain\5aef59ee-8019-48a7-9bcb-aa09283fa701\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 916:
                content = data.get('content', '')
                # Find the HTML start
                html_start = content.find('<!DOCTYPE html>')
                if html_start != -1:
                    html_content = content[html_start:]
                    # The content might be truncated in the log if it was very large, 
                    # but usually overview.txt has the full thing if it's within limits.
                    # Wait, the log might contain the escape characters.
                    print(html_content)
                break
        except:
            continue
