import React, { useMemo } from 'react';
import GuitarChord from './GuitarChord';
import guitarDb from '@tombatossals/chords-db/lib/guitar.json';

const keyMap = {
  'Do': 'C', 'Do#': 'Csharp', 'Reb': 'Csharp',
  'Re': 'D', 'Re#': 'Eb', 'Mib': 'Eb',
  'Mi': 'E',
  'Fa': 'F', 'Fa#': 'Fsharp', 'Solb': 'Fsharp',
  'Sol': 'G', 'Sol#': 'Ab', 'Lab': 'Ab',
  'La': 'A', 'La#': 'Bb', 'Sib': 'Bb',
  'Si': 'B'
};

// Map NeoCat suffixes to chords-db suffixes
const parseChord = (chordStr) => {
  let normalized = chordStr.trim();
  
  // Extract base key
  let baseKey = '';
  for (const k of Object.keys(keyMap).sort((a,b) => b.length - a.length)) {
    if (normalized.startsWith(k)) {
      baseKey = k;
      break;
    }
  }

  if (!baseKey) return null;

  const standardKey = keyMap[baseKey];
  let remainder = normalized.substring(baseKey.length).trim();
  
  let suffix = 'major';
  if (remainder === '-') suffix = 'minor';
  else if (remainder === '-7' || remainder === 'm7') suffix = 'm7';
  else if (remainder === '7') suffix = '7';
  else if (remainder === '7+') suffix = 'maj7';
  else if (remainder === 'dim' || remainder === 'º') suffix = 'dim';
  else if (remainder === 'aug' || remainder === '+') suffix = 'aug';
  else if (remainder === 'sus' || remainder === 'sus4' || remainder === '4') suffix = 'sus4';
  else if (remainder === 'sus2' || remainder === '2') suffix = 'sus2';
  else if (remainder === '6') suffix = '6';
  else if (remainder === '9') suffix = '9';
  else if (remainder === 'm6' || remainder === '-6') suffix = 'm6';
  else if (remainder !== '') {
    // Attempt fallback or ignore unknown complex modifiers
    suffix = 'major';
  }

  return { key: standardKey, suffix };
};

export const ChordDictionary = ({ html }) => {
  const uniqueChords = useMemo(() => {
    if (!html) return [];
    
    const chords = new Set();
    const regex = /<span class="cifra-chord"[^>]*>([\s\S]*?)<\/span>/ig;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      // Remove any tags inside the chord (sometimes they have <b> or <i>)
      const cleanChord = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanChord && !cleanChord.includes('BIS') && !cleanChord.includes('(')) {
        // Handle multiple chords in one line separated by spaces
        cleanChord.split(/\s+/).forEach(c => {
          if (c && c.length > 1 && c.length <= 8) chords.add(c);
        });
      }
    }
    
    // Filter out chords that contain whitespace to prevent bugs
    // (This also forces Vite to reload the module and clear the React element cache)
    return Array.from(chords).filter(c => !c.includes(' '));
  }, [html]);

  const chordData = useMemo(() => {
    return uniqueChords.map(c => {
      const parsed = parseChord(c);
      if (!parsed) return null;
      
      const dbKey = guitarDb.chords[parsed.key];
      if (!dbKey) return null;
      
      const chordVariant = dbKey.find(variant => variant.suffix === parsed.suffix);
      if (!chordVariant) return null;
      
      return {
        original: c,
        data: chordVariant.positions[0] // just show the most common position
      };
    }).filter(Boolean);
  }, [uniqueChords]);

  console.log("ChordDictionary HTML length:", html?.length);
  console.log("uniqueChords:", Array.from(uniqueChords));
  console.log("chordData:", chordData);
  console.log("guitarDb keys:", Object.keys(guitarDb || {}));
  
  if (chordData.length === 0) return null;

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1.5rem 1rem',
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-bg-subtle)',
      borderRadius: '12px'
    }}>
      <h3 style={{ 
        textAlign: 'center', 
        color: 'var(--color-text-main)',
        fontFamily: 'var(--font-heading)',
        marginBottom: '1.5rem',
        fontSize: '1.1rem'
      }}>
        Dicionário de Acordes
      </h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1rem'
      }}>
        {chordData.map((chord, idx) => (
          <div key={idx} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--color-bg-card)',
            padding: '0.75rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)',
            width: '100px'
          }}>
            <strong style={{ 
              marginBottom: '0.25rem', 
              color: 'var(--color-primary)',
              fontSize: '1rem',
              fontFamily: 'var(--font-heading)'
            }}>
              {chord.original}
            </strong>
            <div style={{ width: '70px', height: '90px' }}>
              <GuitarChord chord={chord.data} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
