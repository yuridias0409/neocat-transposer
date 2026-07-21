const americanToLatin = {
  'C': 'Do', 'C#': 'Do#', 'Db': 'Do#',
  'D': 'Re', 'D#': 'Re#', 'Eb': 'Re#',
  'E': 'Mi',
  'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Fa#',
  'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Sol#',
  'A': 'La', 'A#': 'La#', 'Bb': 'La#',
  'B': 'Si'
};

const latinNotesKeys = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

export const getNoteIndex = (noteStr) => {
    if (!noteStr) return 0;
    const match = noteStr.match(/^(Do|Re|Mi|Fa|Sol|La|Si|[CDEFGAB])([#b]?)/i);
    if (!match) return 0;
    
    let base = match[1];
    let acc = match[2];
    
    if (base.length === 1) base = base.toUpperCase();
    else base = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
    
    let note = base + acc;
    if (americanToLatin[note]) {
      note = americanToLatin[note];
    }
    
    const idx = latinNotesKeys.indexOf(note);
    return idx === -1 ? 0 : idx;
};

export const transposeChordString = (chordString, semitones) => {
  if (!chordString) return chordString;
  const shift = (semitones % 12 + 12) % 12;

  return chordString.replace(/(Do|Re|Mi|Fa|Sol|La|Si|[CDEFGAB])([#b]?)(m|-)?([0-9]*)/gi, (match, base, acc, mod, ext) => {
    if (base.length === 1) base = base.toUpperCase();
    else base = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
    
    let note = base + (acc || '');
    if (americanToLatin[note]) {
      note = americanToLatin[note];
    }
    
    const currentIndex = latinNotesKeys.indexOf(note);
    if (currentIndex === -1) return match; 
    
    const newIndex = (currentIndex + shift) % 12;
    let newNote = latinNotesKeys[newIndex];
    
    // Converte 'm' para '-' conforme padrão do Caminho
    let m = mod === 'm' ? '-' : (mod || '');
    return newNote + m + (ext || '');
  });
};
