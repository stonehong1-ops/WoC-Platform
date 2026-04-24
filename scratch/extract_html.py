import json
import os

log_path = r'C:\Users\stone\.gemini\antigravity\brain\5f8a0a1f-7364-4fb4-817c-3872396b4283\.system_generated\logs\overview.txt'

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('source') == 'USER' and 'Calendar View' in data.get('text', ''):
                print("--- START HTML ---")
                print(data['text'])
                print("--- END HTML ---")
        except:
            continue
