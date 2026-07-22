import zipfile
import os

aab_path = r'android\app\build\outputs\bundle\release\app-release.aab'
extract_dir = r'android\build\tmp\aab_inspect_py'

if os.path.exists(extract_dir):
    import shutil
    shutil.rmtree(extract_dir)

os.makedirs(extract_dir, exist_ok=True)

with zipfile.ZipFile(aab_path, 'r') as z:
    for member in z.namelist():
        if 'ic_launcher' in member and member.endswith('.png'):
            z.extract(member, extract_dir)
            print(f"Extracted: {member}")

print("Extraction complete.")
