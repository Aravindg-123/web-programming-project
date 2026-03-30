#!/usr/bin/env python3

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

# Read entire file
with open(filepath, 'rb') as f:
    content = f.read()

# Find the overlay section start
overlay_start = content.find(b'<!-- Overlays -->')
overlay_end = content.find(b'        </div><!-- /map -->', overlay_start)

if overlay_start >= 0 and overlay_end >= 0:
    # Also capture the newlines before
    start_to_check = max(0, overlay_start - 20)
    section_before = content[start_to_check:overlay_start]
    
    # Count back to find the last newline before "<!-- Overlays -->"
    lines_before = content[:overlay_start].split(b'\n')
    
    # Find where to start deletion - from beginning of "<!-- Overlays -->" line
    line_start = overlay_start
    while line_start > 0 and content[line_start - 1:line_start] != b'\n':
        line_start -= 1
    
    # Reconstruct without the overlay
    new_content = content[:line_start] + content[overlay_end:]
    
    with open(filepath, 'wb') as f:
        f.write(new_content)
    
    print("Removed overlay successfully")
else:
    print("Could not find overlay section")
