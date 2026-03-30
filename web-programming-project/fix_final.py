#!/usr/bin/env python3

filepath = r'c:\Users\Exam\web-programming-project\web-programming-project\index.html'

with open(filepath, 'rb') as f:
    content = f.read()

# Find the map-stat-pill marker
idx = content.find(b'map-stat-pill')
if idx > 0:
    # Show context
    section = content[max(0, idx-100):min(len(content), idx+200)]
    print('Section around map-stat-pill:')
    print(repr(section[:150]))
    print('\n')
    
    # Now find the exact starting point - the <div before map-stat-pill
    div_start = content.rfind(b'<div', 0, idx)
    
    # Find the three pill lines and their ending divs
    # Count closing divs from first pill to find end
    overlay_start = content.find(b'<div class="map-stats-overlay">')
    
    if overlay_start >= 0:
        print(f"Found overlay start at {overlay_start}")
        
        # Count divs to find the overlay's closing tag
        div_count = 1
        pos = overlay_start + len(b'<div class="map-stats-overlay">')
        closing_idx = -1
        
        while div_count > 0:
            next_open = content.find(b'<div', pos)
            next_close = content.find(b'</div>', pos)
            
            if next_close == -1:
                break
            if next_open != -1 and next_open < next_close:
                div_count += 1
                pos = next_open + 4
            else:
                div_count -= 1
                pos = next_close + 6
                if div_count == 0:
                    closing_idx = pos
        
        print(f"Found closing at {closing_idx}")
        
        if closing_idx > 0:
            old_section = content[overlay_start:closing_idx]
            
            # Create new section with simple text
            new_section = b'<div class="map-stats-overlay">\n\n            <div class="map-stat-pill">Temp <strong>8.4' + chr(176).encode('utf-8') + b'C</strong></div>\n\n            <div class="map-stat-pill">Swell <strong>2.1m</strong></div>\n\n            <div class="map-stat-pill">Wind <strong>18 kn NW</strong></div>\n\n          </div>'
            
            new_content = content[:overlay_start] + new_section + content[closing_idx:]
            
            with open(filepath, 'wb') as f:
                f.write(new_content)
            
            print("Successfully fixed weather cards!")
        else:
            print("Could not find closing div")
    else:
        print("Could not find overlay")
else:
    print("Could not find map-stat-pill")
