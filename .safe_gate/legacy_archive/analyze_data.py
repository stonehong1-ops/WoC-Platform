import json
import os

# Paths to the saved outputs
woc_file = r'C:\Users\stone\.gemini\antigravity\brain\198c5f21-be48-41c4-850c-c04866c93693\.system_generated\steps\4696\output.txt'
free_file = r'C:\Users\stone\.gemini\antigravity\brain\198c5f21-be48-41c4-850c-c04866c93693\.system_generated\steps\4705\output.txt'

def extract_val(field):
    if not field: return None
    for k in ['stringValue', 'booleanValue', 'timestampValue', 'integerValue']:
        if k in field: return field[k]
    return None

def load_users(file_path, id_field='phoneNumber'):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    users = {}
    for doc in data.get('documents', []):
        fields = doc.get('fields', {})
        uid = doc['name'].split('/')[-1]
        user_data = {k: extract_val(v) for k, v in fields.items()}
        users[uid] = user_data
    return users

woc_users = load_users(woc_file)
free_users = load_users(free_file)

# Normalize Freestyle users by phone (which is the document ID)
# Freestyle IDs are like '01012345678'
# WOC IDs are like '+821012345678'

normalized_free = {}
for uid, data in free_users.items():
    norm_id = '+82' + uid[1:] if uid.startswith('010') else uid
    normalized_free[norm_id] = data

updates = []
corrupted_count = 0

for uid, data in woc_users.items():
    # Corruption check: missing nickname or role
    if not data.get('nickname'):
        source = normalized_free.get(uid)
        if source:
            updates.append({
                'uid': uid,
                'source_data': source,
                'type': 'recovery'
            })
            corrupted_count += 1
        else:
            updates.append({
                'uid': uid,
                'type': 'unknown_corrupted'
            })

print(f"Total WOC users: {len(woc_users)}")
print(f"Total Freestyle users: {len(free_users)}")
print(f"Corrupted users found in WOC: {corrupted_count}")
print(f"Users found in WOC but not in Freestyle: {len([u for u in updates if u.get('type') == 'unknown_corrupted'])}")

# Output sample of updates
for up in updates[:5]:
    print(up)

# Save the work items
with open('recovery_work_items.json', 'w', encoding='utf-8') as f:
    json.dump(updates, f, ensure_ascii=False, indent=2)
