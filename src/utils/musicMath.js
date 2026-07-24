export function hzToNoteName(freq) {
  if (!freq || freq <= 0) return "--";
  const noteNames = [
    "Dó",
    "Dó#",
    "Ré",
    "Ré#",
    "Mi",
    "Fá",
    "Fá#",
    "Sol",
    "Sol#",
    "Lá",
    "Sib",
    "Si",
  ];
  const midiNum = Math.round(12 * Math.log2(freq / 440) + 69);
  const noteIndex = ((midiNum % 12) + 12) % 12;
  const octave = Math.floor(midiNum / 12) - 1;
  return `${noteNames[noteIndex]}${octave}`;
}
export function hzToSemitones(freq) {
  if (!freq || freq <= 0) return 0;
  return 12 * Math.log2(freq / 440) + 69;
}
export function getVoiceClassification(minFreq, maxFreq = null) {
  if (!minFreq) return "Desconhecido";
  const ranges = [
    {
      name: "Baixo",
      min: 80,
      max: 330,
    },
    {
      name: "Barítono",
      min: 100,
      max: 400,
    },
    {
      name: "Tenor",
      min: 130,
      max: 500,
    },
    {
      name: "Contralto",
      min: 175,
      max: 700,
    },
    {
      name: "Mezzo-Soprano",
      min: 220,
      max: 880,
    },
    {
      name: "Soprano",
      min: 260,
      max: 1050,
    },
  ];
  if (maxFreq) {
    let bestMatch = null;
    let minError = Infinity;
    for (const range of ranges) {
      const minDiff = 12 * Math.log2(minFreq / range.min);
      const maxDiff = 12 * Math.log2(maxFreq / range.max);
      const error = minDiff * minDiff + maxDiff * maxDiff;
      if (error < minError) {
        minError = error;
        bestMatch = range.name;
      }
    }
    return bestMatch || "Desconhecido";
  } else {
    if (minFreq < 90) return "Baixo";
    if (minFreq < 115) return "Barítono";
    if (minFreq < 152) return "Tenor";
    if (minFreq < 197) return "Contralto";
    if (minFreq < 240) return "Mezzo-Soprano";
    return "Soprano";
  }
}
