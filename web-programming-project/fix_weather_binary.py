#!/usr/bin/env python3

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

# Read the entire file
with open(filepath, 'rb') as f:
    content = f.read()

# Find the sequence for map-stats-overlay
search = b'map-stats-overlay'
idx = content.find(search)

if idx > 0:
    print(f"Found map-stats-overlay at position {idx}")
    
    # Find the next closing div
    # Split the file at this point
    before = content[:idx]
    rest = content[idx:]
    
    # Find the closing </div> tag for the stats overlay
    # Count opening and closing divs
    div_count = 1
    pos = rest.find(b'>') + 1  # Start after the opening tag
    
    while div_count > 0 and pos < len(rest):
        next_open = rest.find(b'<div', pos)
        next_close = rest.find(b'</div>', pos)
        
        if next_close == -1 or (next_open != -1 and next_open < next_close):
            div_count += 1
            pos = next_open + 4
        else:
            div_count -= 1
            if div_count == 0:
                close_pos = next_close + 6
            else:
                pos = next_close + 6
    
    # Extract the replacement section
    old_section = rest[:close_pos]
    
    new_section = b'''<div class="map-stats-overlay">

            <div class="map-stat-pill">Temp <strong>8.4</strong></div>

            <div class="map-stat-pill">Swell <strong>2.1m</strong></div>

            <div class="map-stat-pill">Wind <strong>18 kn NW</strong></div>

          </div>'''
    
    new_content = before + new_section + rest[close_pos:]
    
    with open(filepath, 'wb') as f:
        f.write(new_content)
    
    print("Fixed weather cards!")
else:
    print("Could not find map-stats-overlay")
