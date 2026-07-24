import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MoreVertical, ZoomIn, ZoomOut, Play, Pause, ArrowUpToLine, Maximize, Minimize, Type } from 'lucide-react';
import { transposeChordString } from '../../../utils';
import { ChordDictionary } from './ChordDictionary';
import './CifraViewer.css';

export default function CifraViewer({ html, capoInfo, onShowToneInfoModal }) {
  const diferencaFormaSemitons = capoInfo?.diferencaFormaSemitons || 0;
  const scrollContainerRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(60);
  const [fontSize, setFontSize] = useState(() => window.innerWidth > 768 ? 15 : 15);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
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
    
    // Reduce excessive newlines (often used in the original app for spacing)
    newHtml = newHtml.replace(/(?:\r?\n){3,}/g, '\n\n');
    
    // Wrap it in a container that preserves whitespace
    return `<div class="cifra-content">${newHtml}</div>`;
  }, [html, diferencaFormaSemitons, capoInfo]);

  useEffect(() => {
    if (isAutoScrolling) {
      const delay = 110 - scrollSpeed;
      autoScrollInterval.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
          // If the container itself has a scrollbar (desktop or bounded height)
          if (scrollHeight > clientHeight) {
            scrollContainerRef.current.scrollTop += 1;
          } else {
            // Otherwise, scroll the window (mobile)
            window.scrollBy(0, 1);
          }
        } else {
          window.scrollBy(0, 1);
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

  // Expand abbreviated choruses
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current.querySelector('.cifra-render > .cifra-content');
    if (!container) return;
    
    const spans = Array.from(container.children);
    
    // We iterate backwards so that if there are multiple abbreviations, 
    // replacing them doesn't mess up the indices of earlier ones.
    for (let i = spans.length - 1; i >= 0; i--) {
      const span = spans[i];
      if (span.classList.contains('cifra-lyric')) {
        const text = span.textContent.trim();
        // Look for abbreviations ending in ...
        if (text.endsWith('...') && text.length > 5) {
          // Extract identifying text by removing ...
          let identifyText = text.replace(/\.\.\.$/, '').trim();
          // Remove prefixes like "A. ", "S. ", "C. " to ensure a match
          identifyText = identifyText.replace(/^[A-Z]\.\s*/, '');
          
          let originalStartIndex = -1;
          for (let j = 0; j < i; j++) {
            const prevSpan = spans[j];
            if (prevSpan.classList.contains('cifra-lyric')) {
              const prevText = prevSpan.textContent.trim();
              if (prevText.includes(identifyText)) {
                if (j > 0 && spans[j-1].classList.contains('cifra-chord')) {
                  originalStartIndex = j - 1;
                } else {
                  originalStartIndex = j;
                }
                break;
              }
            }
          }
          
          if (originalStartIndex !== -1) {
            let originalEndIndex = originalStartIndex;
            let foundEnd = false;
            
            for (let k = originalStartIndex; k < i; k++) {
              if (spans[k].classList.contains('cifra-lyric')) {
                const kText = spans[k].textContent.trim();
                // If it has text but no bold tag, the chorus ended
                if (kText.length > 0 && !spans[k].innerHTML.includes('<b>')) {
                  if (spans[k-1].classList.contains('cifra-chord')) {
                    originalEndIndex = k - 2;
                  } else {
                    originalEndIndex = k - 1;
                  }
                  foundEnd = true;
                  break;
                }
              }
            }
            
            if (!foundEnd) {
              originalEndIndex = i - 1;
            }
            
            if (originalEndIndex >= originalStartIndex) {
              const fragment = document.createDocumentFragment();

              for (let k = originalStartIndex; k <= originalEndIndex; k++) {
                fragment.appendChild(spans[k].cloneNode(true));
              }
              
              span.parentNode.insertBefore(fragment, span);
              
              if (i > 0 && spans[i-1].classList.contains('cifra-chord')) {
                spans[i-1].remove();
              }
              span.remove();
            }
          }
        }
      }
    }
  }, [processedHtml]);

  if (!html) return null;

  return (
    <>
      <div className={`cifra-viewer-wrapper ${isFullScreen ? 'cifra-fullscreen' : ''}`}>
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

        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 0.5rem' }}></div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
          <input 
            type="checkbox" 
            checked={showDictionary}
            onChange={(e) => setShowDictionary(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
          />
          Diagrama da cifra
        </label>
      </div>
      <div 
        className="cifra-scroll-container" 
        ref={scrollContainerRef}
      >
        <div 
          className="cifra-render" 
          style={{ fontSize: `${fontSize}px`, paddingBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: processedHtml }} 
        />
        
        {showDictionary && (
          <div style={{ paddingBottom: '2rem' }}>
            <ChordDictionary html={processedHtml} />
          </div>
        )}
      </div>
      <div className="floating-scroll-controls" onMouseLeave={() => setShowMenu(false)}>
        {showMenu && (
          <div className="floating-menu-options">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.5rem', color: 'var(--color-text-main)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Type size={16} /> Fonte
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--color-bg-subtle)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <button 
                  onClick={() => setFontSize(f => Math.max(8, f - 1))} 
                  style={{ background: 'transparent', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center' }}
                >
                  <ZoomOut size={14} />
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{fontSize}</span>
                <button 
                  onClick={() => setFontSize(f => Math.min(32, f + 1))} 
                  style={{ background: 'transparent', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center' }}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button 
                className={`menu-action-btn ${isAutoScrolling ? 'active' : ''}`}
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              >
                {isAutoScrolling ? <Pause size={16} /> : <Play size={16} />} 
                <span>{isAutoScrolling ? 'Pausar Rolagem' : 'Rolar Automático'}</span>
              </button>
              {isAutoScrolling && (
                <div style={{ padding: '0.5rem 0.5rem 0.5rem 2.25rem' }}>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={scrollSpeed} 
                    onChange={(e) => setScrollSpeed(Number(e.target.value))}
                    className="scroll-speed-slider"
                    title="Velocidade de rolagem"
                  />
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem -0.75rem' }}></div>

            <button 
              onClick={() => {
                setIsFullScreen(!isFullScreen);
                setShowMenu(false);
              }}
              className="menu-action-btn"
            >
              {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />} 
              <span>{isFullScreen ? "Minimizar" : "Expandir"}</span>
            </button>
            
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="menu-action-btn"
            >
              <ArrowUpToLine size={16} /> 
              <span>Ao Início</span>
            </button>
            
            <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem -0.75rem' }}></div>
            
            <label className="menu-action-btn" style={{ justifyContent: 'space-between', margin: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>🎸 Diagrama</span>
              <input 
                type="checkbox" 
                checked={showDictionary}
                onChange={(e) => setShowDictionary(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--color-primary)', transform: 'scale(1.2)' }}
              />
            </label>
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
    </>
  );
}
