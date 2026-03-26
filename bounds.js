// bounds2.js — better bounds: extract M/L/C/Q coordinate pairs only
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('<g id="indiaStatesGroup">');
const end   = html.indexOf('</g>', start);
const gHtml = html.slice(start, end + 4);

const dRe = /\sd="([^"]+)"/g;
let m;
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let pathCount = 0;

while ((m = dRe.exec(gHtml)) !== null) {
  pathCount++;
  const d = m[1];

  // Tokenise: split on path commands, extract only coordinate pairs after M/L/C/Q/S/T
  // Strategy: replace commands with spaces, then parse pairs
  const coordStr = d.replace(/[MmLlCcSsQqTtAaZz]/g, ' ');
  const tokens = coordStr.trim().split(/[\s,]+/).filter(Boolean);

  for (let i = 0; i < tokens.length - 1; i += 2) {
    const x = parseFloat(tokens[i]);
    const y = parseFloat(tokens[i + 1]);
    if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
      // Sanity check — India SVG coords should be in 0-800 range
      if (x >= 0 && x <= 900 && y >= 0 && y <= 900) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
}

// Even better: just find all consecutive float pairs >10 apart from command chars
console.log('Paths:', pathCount);
console.log('X range:', minX.toFixed(2), '→', maxX.toFixed(2), '  width:', (maxX-minX).toFixed(2));
console.log('Y range:', minY.toFixed(2), '→', maxY.toFixed(2), '  height:', (maxY-minY).toFixed(2));

// Sample some coordinates from first path to verify
const firstD = (dRe.lastIndex = 0, dRe.exec(gHtml)) ? RegExp.$1 : '';
const firstM = firstD.match(/M\s*([\d.]+)\s+([\d.]+)/);
if (firstM) console.log('First M point:', firstM[1], firstM[2]);
