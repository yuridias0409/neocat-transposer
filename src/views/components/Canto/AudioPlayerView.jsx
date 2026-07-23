import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Info } from 'lucide-react';
import * as Tone from 'tone';

export function AudioPlayerView({
  canto,
  isPlaying,
  togglePlay,
  isAudioLoaded,
  duration,
  handleSeek,
  isKaraokeMode,
  startKaraoke,
  stopKaraoke,
  formatTime,
  playerRef,
  startTimeRef
}) {
  const progressRef = useRef(null);
  const timeTextRef = useRef(null);
  const animRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      if (playerRef?.current && playerRef.current.state === "started") {
        const elapsed = Tone.now() - startTimeRef.current;
        const dur = playerRef.current.buffer?.duration || 1;

        if (elapsed >= dur) {
          if (progressRef.current) progressRef.current.style.width = '0%';
          if (timeTextRef.current) timeTextRef.current.innerText = `00:00 / ${formatTime(dur)}`;
          return;
        }

        const perc = elapsed / dur * 100;
        if (progressRef.current) progressRef.current.style.width = `${perc}%`;
        if (timeTextRef.current) timeTextRef.current.innerText = `${formatTime(elapsed)} / ${formatTime(dur)}`;
      }
      animRef.current = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      animRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animRef.current);
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, playerRef, startTimeRef, formatTime]);

  const onSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    handleSeek(percent);


    if (progressRef.current) progressRef.current.style.width = `${percent * 100}%`;
    if (timeTextRef.current) timeTextRef.current.innerText = `${formatTime(percent * duration)} / ${formatTime(duration)}`;
  };

  if (!canto || !canto.audio_url) return null;

  return (
    <div className="audio-section">
      <div className="audio-player card">
        <div className="player-controls">
          <button className="btn-circle play-btn" onClick={togglePlay} disabled={!isAudioLoaded}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <div className="player-timeline" onClick={onSeek} style={{ background: '#e0e0e0', height: '12px', borderRadius: '6px', flex: 1, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
            <div ref={progressRef} className="timeline-progress" style={{ width: `0%`, height: '100%', background: '#a13333', transition: 'width 0.1s linear' }}></div>
          </div>
          <div ref={timeTextRef} style={{ fontSize: '0.85rem', color: '#666', fontFamily: 'monospace', minWidth: '85px' }}>
            00:00 / {formatTime(duration)}
          </div>
          
          {canto.tom_audio && canto.tom_audio !== '?' && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => setShowInfo(!showInfo)} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 0.25rem', display: 'flex', alignItems: 'center' }}
                title="Informação do áudio"
              >
                <Info size={16} />
              </button>
              {showInfo && (
                <div style={{ position: 'absolute', bottom: '120%', right: '0', background: '#334155', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', whiteSpace: 'nowrap', zIndex: 50, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  Áudio original gravado em: <strong>{canto.tom_audio}</strong>
                  <div style={{ position: 'absolute', bottom: '-4px', right: '10px', width: '8px', height: '8px', background: '#334155', transform: 'rotate(45deg)' }}></div>
                </div>
              )}
            </div>
          )}
          <button
            className={`btn btn-sm ${isKaraokeMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={isKaraokeMode ? stopKaraoke : startKaraoke}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
            🎤 {isKaraokeMode ? 'Parar Cante junto' : 'Cante junto'}
          </button>
        </div>
      </div>
    </div>);

}