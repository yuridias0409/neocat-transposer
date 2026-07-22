import React from 'react';
import { Play, Pause } from 'lucide-react';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

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
    _jsxDEV("div", { className: "audio-section", children:
      _jsxDEV("div", { className: "audio-player card", children:
        _jsxDEV("div", { className: "player-controls", children: [
          _jsxDEV("button", { className: "btn-circle play-btn", onClick: togglePlay, disabled: !isAudioLoaded, children:
            isPlaying ? _jsxDEV(Pause, { size: 20, fill: "currentColor" }, void 0, false) : _jsxDEV(Play, { size: 20, fill: "currentColor" }, void 0, false) }, void 0, false
          ),
          _jsxDEV("div", { className: "player-timeline", onClick: handleSeek, style: { background: '#e0e0e0', height: '12px', borderRadius: '6px', flex: 1, overflow: 'hidden', cursor: 'pointer', position: 'relative' }, children:
            _jsxDEV("div", { className: "timeline-progress", style: { width: `${progress}%`, height: '100%', background: '#a13333', transition: 'width 0.1s linear' } }, void 0, false) }, void 0, false
          ),
          _jsxDEV("div", { style: { fontSize: '0.85rem', color: '#666', fontFamily: 'monospace', minWidth: '85px' }, children: [
            formatTime(currentTime), " / ", formatTime(duration)] }, void 0, true
          ),
          _jsxDEV("button", {
            className: `btn btn-sm ${isKaraokeMode ? 'btn-primary' : 'btn-outline'}`,
            onClick: isKaraokeMode ? stopKaraoke : startKaraoke,
            style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }, children: [
            "🎤 ",
            isKaraokeMode ? 'Parar Cante junto' : 'Cante junto'] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      ) }, void 0, false
    ));

}