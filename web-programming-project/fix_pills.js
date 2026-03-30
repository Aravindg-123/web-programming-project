const fs = require('fs');

const buf = fs.readFileSync('index.html');

// Build replacement buffers
// Line 937: corrupted thermometer + "Sea Temp <strong>8.4°C</strong>" 
// Replace whole pill content with clean version
// Target bytes for line 937 pill section (unique broken prefix c3 b0 c5 b8 c5 92 c2 a1 c3 af c2 b8 c2 8f)
// Then "20 53 65 61..." + corrupted degree (c3 82 c2 b0 43)

// Strategy: convert file content to a hex string, find and replace the corrupted byte patterns
let hex = buf.toString('hex');

// Line 937: broken emoji + temperature (c3b0 c5b8 c592 c2a1 c3af c2b8 c28f) = corrupted 🌡️
// followed by space + "Sea Temp <strong>8.4" + corrupted °C (c382 c2b0 43) 
const badThermo = 'c3b0c5b8c592c2a1c3afc2b8c28f2053656120' + // corrupted 🌡️ + " Sea T"
                  '54656d70203c737472f6e673e382e34c382c2b043'; // ... nope hex is different

// Easier: just search the raw buffer for the sequence and splice in replacement
function replaceBytes(buf, searchHex, replaceHex) {
  const search = Buffer.from(searchHex, 'hex');
  const replace = Buffer.from(replaceHex, 'hex');
  const idx = buf.indexOf(search);
  if (idx === -1) { console.log('NOT FOUND: ' + searchHex.substring(0, 20)); return buf; }
  console.log('Found at offset ' + idx);
  return Buffer.concat([buf.slice(0, idx), replace, buf.slice(idx + search.length)]);
}

// From hex dump line 937: the corrupted emoji bytes are c3b0 c5b8 c592 c2a1 c3af c2b8 c28f
// and the corrupted degree: c382 c2b0 43 -> should be c2b043 (°C in UTF-8 is c2b0 + 43)
// Replace: corrupted_emoji + " Sea Temp <strong>8.4" + corrupted_degree + "C"
// with: clean "🌡️" emoji + rest

// Simpler: replace the whole div content
// Corrupted thermo line: c3b0c5b8c592c2a1c3afc2b8c28f (7 bytes of garbage for 🌡️)
const thermo_bad  = 'c3b0c5b8c592c2a1c3afc2b8c28f';
const thermo_good = 'f09f8ca1efb88f'; // 🌡️ in UTF-8

const deg_bad  = 'c382c2b0';   // corrupted Â° -> °
const deg_good = 'c2b0';       // ° in UTF-8

// Wind line 941: c3b0 c5b8 e28099 c2a8 -> corrupted 💨
const wind_bad  = 'c3b0c5b8e28099c2a8';
const wind_good = 'f09f92a8'; // 💨 in UTF-8

let b = buf;
b = replaceBytes(b, thermo_bad, thermo_good);
b = replaceBytes(b, deg_bad, deg_good);
b = replaceBytes(b, wind_bad, wind_good);

fs.writeFileSync('index.html', b);
console.log('Written! Verifying...');

// Verify by reading back
const verify = fs.readFileSync('index.html', 'utf8');
verify.split('\n').forEach((l, i) => {
  if (l.includes('map-stat-pill')) console.log(`Line ${i+1}: ${l.trim()}`);
});
