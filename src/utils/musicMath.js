export function hzToNoteName(freq) {
  if (!freq || freq <= 0) return "--";
  const noteNames = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
  const midiNum = Math.round(12 * (Math.log2(freq / 440)) + 69);
  const noteIndex = (midiNum % 12 + 12) % 12;
  const octave = Math.floor(midiNum / 12) - 1;
  return `${noteNames[noteIndex]}${octave}`;
}

export function hzToSemitones(freq) {
  if (!freq || freq <= 0) return 0;
  return 12 * Math.log2(freq / 440) + 69;
}
