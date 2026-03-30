#!/usr/bin/env python3

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

# Read the file - try different encodings
encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
content = None

for enc in encodings_to_try:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            content = f.read()
        print(f"Successfully read with {enc}")
        break
    except:
        continue

if content is None:
    print("Could not read file with any encoding")
    exit(1)

# Just find the lines with "Sea Temp" and replace them more aggressively
lines = content.split('\n')
new_lines = []

for line in lines:
    if 'map-stat-pill' in line:
        if 'Sea Temp' in line or 'Â°C' in line:
            new_lines.append('            <div class="map-stat-pill">Temp <strong>8.4°C</strong></div>')
        elif 'Swell' in line or '2.1m' in line:
            new_lines.append('            <div class="map-stat-pill">Swell <strong>2.1m</strong></div>')
        elif 'Wind' in line or '18 kn' in line:
            new_lines.append('            <div class="map-stat-pill">Wind <strong>18 kn NW</strong></div>')
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

# Write back as UTF-8
new_content = '\n'.join(new_lines)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed weather cards!")
