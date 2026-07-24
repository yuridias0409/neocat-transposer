import React from 'react';

const GuitarChord = ({ chord, color = "var(--color-primary)" }) => {
  if (!chord) return null;
  
  const strings = 6;
  const frets = 4;
  const width = 100;
  const height = 120;
  
  // Padding and margins
  const topMargin = 25;
  const bottomMargin = 10;
  const leftMargin = 20;
  const rightMargin = 10;
  
  const stringSpacing = (width - leftMargin - rightMargin) / (strings - 1);
  const fretSpacing = (height - topMargin - bottomMargin) / frets;
  
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {/* Draw frets (horizontal lines) */}
      {Array.from({ length: frets + 1 }).map((_, i) => (
        <line
          key={`fret-${i}`}
          x1={leftMargin}
          y1={topMargin + i * fretSpacing}
          x2={width - rightMargin}
          y2={topMargin + i * fretSpacing}
          stroke="#475569"
          strokeWidth={i === 0 && chord.baseFret === 1 ? 3 : 1} /* Thicker top line if baseFret is 1 */
        />
      ))}
      
      {/* Draw strings (vertical lines) */}
      {Array.from({ length: strings }).map((_, i) => (
        <line
          key={`string-${i}`}
          x1={leftMargin + i * stringSpacing}
          y1={topMargin}
          x2={leftMargin + i * stringSpacing}
          y2={height - bottomMargin}
          stroke="#475569"
          strokeWidth={1}
        />
      ))}

      {/* Base Fret Indicator */}
      {chord.baseFret > 1 && (
        <text
          x={leftMargin - 8}
          y={topMargin + fretSpacing / 2 + 4}
          fontSize="10"
          fontFamily="sans-serif"
          fill="#475569"
          textAnchor="end"
        >
          {chord.baseFret}fr
        </text>
      )}

      {/* Draw Barres */}
      {chord.barres && chord.barres.map((barre, i) => {
        // Barre value is the fret number
        // We need to find the lowest and highest string played on this fret to draw the barre across
        let minString = 5;
        let maxString = 0;
        chord.frets.forEach((fret, stringIdx) => {
          if (fret === barre || fret > barre) {
            if (stringIdx < minString) minString = stringIdx;
            if (stringIdx > maxString) maxString = stringIdx;
          }
        });
        
        if (minString > maxString) return null;
        
        return (
          <rect
            key={`barre-${i}`}
            x={leftMargin + minString * stringSpacing - 4}
            y={topMargin + (barre - 1) * fretSpacing + fretSpacing / 2 - 4}
            width={(maxString - minString) * stringSpacing + 8}
            height={8}
            rx={4}
            fill={color}
          />
        );
      })}

      {/* Draw Dots and X/O */}
      {chord.frets.map((fret, i) => {
        const x = leftMargin + i * stringSpacing;
        
        if (fret === -1) {
          // Muted string (X)
          return (
            <text
              key={`mute-${i}`}
              x={x}
              y={topMargin - 8}
              fontSize="12"
              fontFamily="sans-serif"
              fill="#ef4444"
              textAnchor="middle"
            >
              x
            </text>
          );
        }
        
        if (fret === 0) {
          // Open string (O)
          return (
            <circle
              key={`open-${i}`}
              cx={x}
              cy={topMargin - 10}
              r={4}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
          );
        }

        // Played fret (Dot)
        // If there's a barre on this fret, don't draw a dot unless we want to. Usually barres cover it.
        // We will just draw the dot anyway, it looks fine.
        const y = topMargin + (fret - 1) * fretSpacing + fretSpacing / 2;
        return (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={5}
            fill={color}
          />
        );
      })}
    </svg>
  );
};

export default GuitarChord;
