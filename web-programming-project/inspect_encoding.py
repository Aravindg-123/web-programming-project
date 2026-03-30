#!/usr/bin/env python3

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

# Read as binary and find the map-stat-pill section
with open(filepath, 'rb') as f:
    content = f.read()

# Find "Sea Temp" location
sea_idx = content.find(b'Sea Temp')
if sea_idx > 0:
    # Show 100 bytes before and after
    start = max(0, sea_idx - 100)
    end = min(len(content), sea_idx + 100)
    
    section = content[start:end]
    
    print("Binary section around 'Sea Temp':")
    print(repr(section))
    print("\nHex dump:")
    print(' '.join(f'{b:02x}' for b in section))
    
    # Decode with different encodings
    print("\n\nUTF-8 decode (with replace):")
    print(section.decode('utf-8', errors='replace'))
    
    print("\nLatin-1 decode:")
    print(section.decode('latin-1', errors='replace'))
else:
    print("Could not find 'Sea Temp'")
