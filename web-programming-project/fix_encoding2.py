#!/usr/bin/env python3
import os

# Read file as binary first
filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

with open(filepath, 'rb') as f:
    content = f.read()

# Convert to string using different encoding guesses
try:
    # Try UTF-8 first
    text = content.decode('utf-8')
    print("File is UTF-8 encoded")
except:
    try:
        # Try UTF-16
        text = content.decode('utf-16')
        print("File is UTF-16 encoded")
    except:
        try:
            # Try latin-1
            text = content.decode('latin-1')
            print("File is latin-1 encoded")
        except:
            print("Could not decode file")
            exit(1)

# Now find and replace line by line
lines = text.split('\n')
new_lines = []

for i, line in enumerate(lines):
    # Check if this is a weather pill line
    if 'map-stat-pill' in line and 'Sea Temp' in line:
        # Replace the corrupted characters
        line = line.replace('ðŸŒ¡ï¸', '🌡️')
        line = line.replace('Â°', '°')
        new_lines.append(line)
    elif 'map-stat-pill' in line and 'Swell' in line:
        line = line.replace('ðŸŒŠ', '🌊')
        new_lines.append(line)
    elif 'map-stat-pill' in line and 'Wind' in line:
        line = line.replace('ðŸ\'¨', '💨')
        new_lines.append(line)
    else:
        new_lines.append(line)

# Write back as UTF-8
new_text = '\n'.join(new_lines)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("File encoding fixed and written as UTF-8")
