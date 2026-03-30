#!/usr/bin/env python3

import os
import sys

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

# Read as binary
with open(filepath, 'rb') as f:
    content = f.read()

# Display what we're looking for
print("File size:", len(content))
print("Looking for map-stat-pill sections...")

# Let's hex dump the first occurrence
# Search for "map-stat-pill" section
idx = content.find(b'map-stats-overlay')
if idx != -1:
    print(f"\nFound map-stats-overlay at position {idx}")
    # Show 500 bytes from there
    section = content[idx:idx+500]
    print("\nHex representation of section:")
    print(' '.join(f'{b:02x}' for b in section[:200]))
    print("\nASCII representation:")
    print(section.decode('utf-8', errors='replace')[:300])
else:
    print("Could not find map-stats-overlay")

# Now try to fix it
# UTF-8 for 🌡️ is: f0 9f 8c a1
# If stored as Latin-1, it would appear as mojibake
# But let's just replace the sequences we know

replacements = [
    # (old bytes, new bytes) pairs
    (b'map-stat-pill">\xc3\xb0\xc5\x9f\xc2\x8c\xc2\xa1\xc3\xaf\xc2\xb8\xc2\x8d', 
     b'map-stat-pill">\xf0\x9f\x8c\xa1'),  # Thermometer
    (b'map-stat-pill">\xc3\xb0\xc5\x9f\xc2\x8c\xc2\x90', 
     b'map-stat-pill">\xf0\x9f\x8c\x8a'),  # Wave
    (b'map-stat-pill">\xc3\xb0\xc5\x9f\xc2\x92\xc2\xa8', 
     b'map-stat-pill">\xf0\x9f\x92\xa8'),  # Wind
    (b'\xc3\x82\xc2\xb0', b'\xc2\xb0'),  # Degree symbol fix
]

for old, new in replacements:
    if old in content:
        print(f"Found and replacing pattern")
        content = content.replace(old, new)
    
# Also try simple character replacements
# Look for mojibake patterns
print("\nAttempting mojibake fixes...")
try:
    # Try to decode as latin-1 and re-encode as utf-8
    text = content.decode('utf-8', errors='ignore')
    # If that works, just save it back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("File is already valid UTF-8")
except Exception as e:
    print(f"UTF-8 decode failed: {e}")
    # Try latin-1
    try:
        text = content.decode('latin-1')
        # Now we need to fix the double-encoded UTF-8
        # This is complex, so let's just write our fixes
        text = text.replace('ðŸŒ¡ï¸', '🌡️')
        text = text.replace('ðŸŒŠ', '🌊')
        text = text.replace('ðŸ\'¨', '💨')
        text = text.replace('Â°', '°')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print("Applied text-level replacements for mojibake")
    except Exception as e2:
        print(f"latin-1 decode also failed: {e2}")

print("\nDone!")
