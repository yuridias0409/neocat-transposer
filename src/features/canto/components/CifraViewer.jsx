import React, { useMemo, useState, useEffect, useRef } from 'react';
import { transposeChordString } from '../../../utils';
import './CifraViewer.css';

export default function CifraViewer({ html, capoInfo, onShowToneInfoModal }) {
  const diferencaFormaSemitons = capoInfo?.diferencaFormaSemitons || 0;
  const scrollContainerRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(60);
  const autoScrollInterval = useRef(null);

  // Helper function to process the HTML
  const processedHtml = useMemo(() => {
    if (!html) return '';

    const finalOffset = diferencaFormaSemitons;

    // Remove HTML boilerplate
    let str = html.replace(/<html.*?>.*?<body.*?><div>\s*/is, '');
    str = str.replace(/<\/div><\/body><\/html>\s*/is, '');

    // Replace @capot@ and any following Braçadeira text with dynamic capo info
    str = str.replace(/<span class="inv">\s*@capot@\s*<\/span>\s*(?:Braçadeira.*?Traste)?\r?\n?/ig, () => {
      if (capoInfo && capoInfo.capoCasa > 0) {
        return `Braçadeira ${capoInfo.capoCasa}ª traste\n`;
      }
      return '';
    });

    // Remove other hidden tags and their trailing newlines
    str = str.replace(/<span class="inv">.*?<\/span>\r?\n?/gi, '');
    
    // Replace Title and clean up spacing around it
    str = str.replace(/<FONT COLOR="#FF0000">\s*<H1>([\s\S]*?)<\/H1>\s*/ig, (match, p1) => {
       return `<div class="cifra-title" style="color: var(--color-primary); margin-bottom: 1.5rem; text-align: center; font-weight: bold; font-size: 1.25rem;">${p1}</div>`;
    });
    
    // Split by <FONT COLOR= for chords and lyrics
    const parts = str.split(/<FONT COLOR="/i);
    if (parts.length === 1) return `<div class="cifra-content">${str}</div>`;

    let newHtml = parts[0];

    for (let i = 1; i < parts.length; i++) {
      let part = parts[i];
      const colorEndIdx = part.indexOf('">');
      if (colorEndIdx === -1) {
        newHtml += '<FONT COLOR="' + part;
        continue;
      }
      
      const color = part.substring(0, colorEndIdx);
      let content = part.substring(colorEndIdx + 2);

      if (color === '#FF0000') {
        content = transposeChordString(content, finalOffset);
        newHtml += `<span class="cifra-chord" style="color: var(--color-primary); font-weight: bold;">${content}</span>`;
      } else {
        newHtml += `<span class="cifra-lyric">${content}</span>`;
      }
    }

    // Clean up the html, body, and div tags from the raw source
    newHtml = newHtml.replace(/<html>.*?<body><div>/i, '');
    newHtml = newHtml.replace(/<\/div><\/body><\/html>/i, '');
    
    // Wrap it in a container that preserves whitespace
    return `<div class="cifra-content">${newHtml}</div>`;
  }, [html, diferencaFormaSemitons]);

  useEffect(() => {
    if (isAutoScrolling) {
      const delay = 110 - scrollSpeed;
      autoScrollInterval.current = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += 1;
        }
      }, delay); // Speed of auto-scroll based on slider
    } else {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    }

    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  if (!html) return null;

  return (
    <div className="cifra-viewer-wrapper">
      <div 
        className="cifra-scroll-container" 
        ref={scrollContainerRef}
      >
        <div 
          className="cifra-render" 
          dangerouslySetInnerHTML={{ __html: processedHtml }} 
        />
      </div>
      <div className="floating-scroll-controls">
        <button 
          className={`btn-auto-scroll ${isAutoScrolling ? 'active' : ''}`}
          onClick={() => setIsAutoScrolling(!isAutoScrolling)}
        >
          {isAutoScrolling ? '⏸ Pausar' : '▶️ Rolar'}
        </button>
        {isAutoScrolling && (
          <input 
            type="range" 
            min="10" 
            max="100" 
            value={scrollSpeed} 
            onChange={(e) => setScrollSpeed(Number(e.target.value))}
            className="scroll-speed-slider"
            title="Velocidade de rolagem"
          />
        )}
      </div>
    </div>
  );
}
