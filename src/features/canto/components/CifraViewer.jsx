import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MoreVertical, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';
import { transposeChordString } from '../../../utils';
import './CifraViewer.css';

export default function CifraViewer({ html, capoInfo, onShowToneInfoModal }) {
  const diferencaFormaSemitons = capoInfo?.diferencaFormaSemitons || 0;
  const scrollContainerRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(60);
  const [fontSize, setFontSize] = useState(() => window.innerWidth > 768 ? 14 : 12);
  const [showMenu, setShowMenu] = useState(false);
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
       return `<div class="cifra-title" style="color: var(--color-primary); margin-bottom: 1.5rem; text-align: center; font-weight: bold; font-size: 1.5em;">${p1}</div>`;
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
      <div className="desktop-font-controls" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Tamanho da Fonte:</span>
        <button 
          onClick={() => setFontSize(f => Math.max(8, f - 1))} 
          className="btn-floating-icon"
          title="Diminuir Fonte"
        >
          <ZoomOut size={16} />
        </button>
        <span className="font-size-display">{fontSize}</span>
        <button 
          onClick={() => setFontSize(f => Math.min(32, f + 1))} 
          className="btn-floating-icon"
          title="Aumentar Fonte"
        >
          <ZoomIn size={16} />
        </button>
      </div>
      <div 
        className="cifra-scroll-container" 
        ref={scrollContainerRef}
      >
        <div 
          className="cifra-render" 
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: processedHtml }} 
        />
      </div>
      <div className="floating-scroll-controls" onMouseLeave={() => setShowMenu(false)}>
        {showMenu && (
          <div className="floating-menu-options">
            <div className="font-controls">
              <button 
                onClick={() => setFontSize(f => Math.max(8, f - 1))} 
                className="btn-floating-icon"
                title="Diminuir Fonte"
              >
                <ZoomOut size={18} />
              </button>
              <span className="font-size-display">{fontSize}</span>
              <button 
                onClick={() => setFontSize(f => Math.min(32, f + 1))} 
                className="btn-floating-icon"
                title="Aumentar Fonte"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            
            <div className="scroll-controls-container">
              <button 
                className={`btn-auto-scroll ${isAutoScrolling ? 'active' : ''}`}
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              >
                {isAutoScrolling ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Rolar</>}
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
        )}
        
        <button 
          className="btn-floating-fab"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Menu de opções da cifra"
        >
          <MoreVertical size={24} />
        </button>
      </div>
    </div>
  );
}
