import re
import os
import json

log_path = r'C:\Users\stone\.gemini\antigravity\brain\5f8a0a1f-7364-4fb4-817c-3872396b4283\.system_generated\logs\overview.txt'
output_path = r'C:\Users\stone\WoC\scratch\found_html.html'

try:
    with open(log_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Search for USER messages specifically
    # The JSON lines might be split or complex, so I'll try to find the text part
    user_msgs = []
    for line in content.splitlines():
        try:
            data = json.loads(line)
            if data.get('source') == 'USER' and 'Freestyle Tango - Calendar View' in data.get('text', ''):
                user_msgs.append(data['text'])
        except:
            continue
            
    if user_msgs:
        html_content = user_msgs[-1]
        # Find the actual HTML part within the text
        html_start = html_content.find('<!DOCTYPE html>')
        html_end = html_content.find('</html>') + 7
        final_html = html_content[html_start:html_end]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(final_html)
        print(f"Successfully extracted HTML to {output_path}")
    else:
        print("No USER message with HTML found.")
except Exception as e:
    print(f"Error: {e}")
