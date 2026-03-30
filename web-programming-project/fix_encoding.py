#!/usr/bin/env python3
import re

# Read the HTML file
filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the weather cards with proper emoji and UTF-8 characters
# Replace the entire map-stats-overlay section

old_weather = '''          <div class="map-stats-overlay">

            <div class="map-stat-pill">ðŸŒ¡ï¸ Sea Temp <strong>8.4Â°C</strong></div>

            <div class="map-stat-pill">ðŸŒŠ Swell <strong>2.1m</strong></div>

            <div class="map-stat-pill">ðŸ'¨ Wind <strong>18 kn NW</strong></div>

          </div>'''

new_weather = '''          <div class="map-stats-overlay">

            <div class="map-stat-pill">🌡️ Sea Temp <strong>8.4°C</strong></div>

            <div class="map-stat-pill">🌊 Swell <strong>2.1m</strong></div>

            <div class="map-stat-pill">💨 Wind <strong>18 kn NW</strong></div>

          </div>'''

# Try to find with different encoding possibilities
patterns_to_try = [
    # Try exact match
    ('ðŸŒ¡ï¸', '🌡️'),
    ('ðŸŒŠ', '🌊'),
    ('ðŸ\'¨', '💨'),
    ('Â°', '°'),
]

for old_char, new_char in patterns_to_try:
    content = content.replace(old_char, new_char)

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed encoding issues in weather cards")
