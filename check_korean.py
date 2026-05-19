import re

def check_korean():
    try:
        with open('src/contexts/LanguageContext.tsx', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        en_start = -1
        kr_start = -1
        
        for i, line in enumerate(lines):
            if 'EN: {' in line:
                en_start = i
            if 'KR: {' in line:
                kr_start = i
                break
                
        if en_start == -1 or kr_start == -1:
            print("Could not find EN or KR blocks")
            return
            
        korean_pattern = re.compile(r'[가-힣]')
        matches = []
        for i in range(en_start, kr_start):
            line = lines[i]
            if korean_pattern.search(line):
                matches.append((i+1, line.strip()))
                
        print(f"Found {len(matches)} lines with Korean characters in EN block.")
        for i, (line_num, line) in enumerate(matches[:20]):
            print(f"Line {line_num}: {line}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_korean()
