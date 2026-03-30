#!/usr/bin/env python3

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace using simple substring matching
# Find the map-stats-overlay section and replace the entire thing
start_marker = '<div class="map-stats-overlay">'
end_marker = '</div>\n\n\n\n\n        </div><!-- /map -->'

if start_marker in content:
    idx = content.find(start_marker)
    # Find the end
    end_idx = content.find('</div><!-- /map -->', idx)
    
    new_section = '''<div class="map-stats-overlay">

            <div class="map-stat-pill">🌡 Sea Temp <strong>8.4°C</strong></div>

            <div class="map-stat-pill">〰 Swell <strong>2.1m</strong></div>

            <div class="map-stat-pill">💨 Wind <strong>18 kn NW</strong></div>

          </div>'''
    
    # Find the exact end of the closing div
    closing_div_idx = content.find('</div>', idx)
    # But we want the closing div for map-stats-overlay, not the whole sub-block
    # Let's count: open at idx, find the matching close
    open_count = 1
    pos = idx + len(start_marker)
    close_idx = -1
    
    while open_count > 0 and pos < len(content):
        if content[pos:pos+4] == '<div':
            open_count += 1
            pos += 4
        elif content[pos:pos+6] == '</div>':
            open_count -= 1
            if open_count == 0:
                close_idx = pos + 6
                break
            pos += 6
        else:
            pos += 1
    
    if close_idx > 0:
        old_section = content[idx:close_idx]
        new_content = content[:idx] + new_section + content[close_idx:]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("Successfully replaced weather cards with simplified emoji!")
    else:
        print("Could not find closing div")
else:
    print("Could not find start marker")
