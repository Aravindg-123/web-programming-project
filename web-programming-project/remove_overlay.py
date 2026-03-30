#!/usr/bin/env python3

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Find and remove the map-stats-overlay section
output_lines = []
skip_until_end_overlay = False

for i, line in enumerate(lines):
    if 'map-stats-overlay' in line and '<div' in line:
        skip_until_end_overlay = True
        # Also skip the comment before
        if output_lines and '<!-- Overlays -->' in output_lines[-1]:
            output_lines.pop()
            if output_lines and output_lines[-1].strip() == '':
                output_lines.pop()
        continue
    
    if skip_until_end_overlay:
        if '</div>' in line and 'map-stats-overlay' not in line:
            # This should be the closing tag - check if we should include it
            # Let's check if the next few line suggests this is the map close
            if i + 2 < len(lines) and 'map' in lines[i + 2]:
                skip_until_end_overlay = False
            elif i + 10 < len(lines):
                upcoming = ''.join(lines[i:i+3])
                if 'map' in upcoming:
                    skip_until_end_overlay = False
            continue
        if '          </div>' in line:
            skip_until_end_overlay = False
            continue
    
    output_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("Removed map-stats-overlay section")
