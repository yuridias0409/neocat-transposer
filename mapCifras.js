import fs from 'fs';
import { cantosData as cantos } from './src/data.js';

const normalizeStr = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const flutterCantos = JSON.parse(fs.readFileSync('/Users/user/Documents/MyCodes/Ressuscitou_Flutter_Temp/assets/cantos.json', 'utf8'));

const mappedCifras = {};
let matchCount = 0;
let missing = [];

const flutterMap = new Map();
for (const fc of flutterCantos) {
  flutterMap.set(normalizeStr(fc.titulo), fc);
}

for (const [id, canto] of Object.entries(cantos)) {
  const normTitle = normalizeStr(canto.titulo);
  const fc = flutterMap.get(normTitle);
  if (fc) {
    mappedCifras[id] = {
      html: Buffer.from(fc.html_base64, 'base64').toString('utf8')
    };
    matchCount++;
  } else {
    missing.push(canto.titulo);
  }
}

console.log(`Matched ${matchCount} out of ${Object.keys(cantos).length} songs.`);
if (missing.length > 0) {
  console.log("Missing matches for some songs. Here are the first 10:");
  console.log(missing.slice(0, 10));
}

// Make the data directory if it doesn't exist
if (!fs.existsSync('./src/data')) {
  fs.mkdirSync('./src/data');
}

fs.writeFileSync('./src/data/cifras.json', JSON.stringify(mappedCifras, null, 2));
console.log("Saved to src/data/cifras.json");
