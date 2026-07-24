const fs = require('fs');
const content = fs.readFileSync('src/data.js', 'utf-8');
const jsonStr = content.split('=', 2)[1].replace(/;[\s\n]*$/, '');
const db = JSON.parse(jsonStr);
let missing = 0;
let total = 0;
let missingAudioAndFreq = 0;
for (const key in db) {
  total++;
  const canto = db[key];
  if (!canto.freq_min_curada) {
    missing++;
    if (!canto.audio_url) missingAudioAndFreq++;
    console.log("Missing freq:", canto.titulo, " - Has audio?", !!canto.audio_url);
  }
}
console.log(`Total: ${total}, Missing Freq: ${missing}, Missing both Audio and Freq: ${missingAudioAndFreq}`);
