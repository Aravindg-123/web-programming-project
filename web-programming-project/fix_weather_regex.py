#!/usr/bin/env python3
import re

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Fix the broken escape sequences and emoji
# Replace the corrupted map-stat-pill lines
content = re.sub(
    r'<div class="map-stat-pill[^>]*>[^<]*Sea Temp[^<]*</div>',
    '<div class="map-stat-pill">Temp <strong>8.4°C</strong></div>',
    content
)

content = re.sub(
    r'<div class="map-stat-pill[^>]*>[^<]*Swell[^<]*</div>',
    '<div class="map-stat-pill">Swell <strong>2.1m</strong></div>',
    content
)

content = re.sub(
    r'<div class="map-stat-pill[^>]*>[^<]*Wind[^<]*</div>',
    '<div class="map-stat-pill">Wind <strong>18 kn NW</strong></div>',
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed weather cards with regex!")
