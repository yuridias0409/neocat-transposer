import React from 'react';
import { Play, Pause } from 'lucide-react';

export function AudioPlayerView({ 
  canto, 
  isPlaying, 
  togglePlay, 
  isAudioLoaded, 
  progress, 
  currentTime, 
  duration, 
  handleSeek,
  isKaraokeMode,
  startKaraoke,
  stopKaraoke,
  formatTime
}) {
  if (!canto || !canto.audio_url) return null;

  return (
    <div className="audio-section mb-4">
      <div className="audio-player card mb-3">
        <div className="player-controls">
          <button className="btn-circle play-btn" onClick={togglePlay} disabled={!isAudioLoaded}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <div className="player-timeline" onClick={handleSeek} style={{background: '#e0e0e0', height: '12px', borderRadius: '6px', flex: 1, overflow: 'hidden', cursor: 'pointer', position: 'relative'}}>
            <div className="timeline-progress" style={{ width: `${progress}%`, height: '100%', background: '#a13333', transition: 'width 0.1s linear' }}></div>
          </div>
          <div style={{fontSize: '0.85rem', color: '#666', fontFamily: 'monospace', minWidth: '85px'}}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <button 
            className={`btn btn-sm ${isKaraokeMode ? 'btn-primary' : 'btn-outline'}`} 
            onClick={isKaraokeMode ? stopKaraoke : startKaraoke}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
          >
            🎤 {isKaraokeMode ? 'Parar Cante junto' : 'Cante junto'}
          </button>
        </div>
      </div>
    </div>
  );
}
