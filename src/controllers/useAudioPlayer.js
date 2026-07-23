import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { getNoteIndex } from '../utils';

export function useAudioPlayer(canto, transposition) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!canto || !canto.audio_url) return;

    setIsAudioLoaded(false);

    pitchShiftRef.current = new Tone.PitchShift({
      pitch: 0,
      windowSize: 0.1,
      delayTime: 0,
      feedback: 0
    }).toDestination();

    playerRef.current = new Tone.Player({
      url: encodeURI(canto.audio_url),
      onload: () => {
        setIsAudioLoaded(true);
        if (playerRef.current && playerRef.current.buffer) {
          setDuration(playerRef.current.buffer.duration);
        }
      }
    }).connect(pitchShiftRef.current);

    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }
      if (pitchShiftRef.current) pitchShiftRef.current.dispose();
    };
  }, [canto]);

  useEffect(() => {
    if (pitchShiftRef.current) {
      let audioPitchShift = transposition - (() => {
        if (!canto?.tom_audio || !canto?.tom_original) return 0;
        let offset = getNoteIndex(canto.tom_audio) - getNoteIndex(canto.tom_original);
        if (offset > 6) offset -= 12;
        if (offset < -6) offset += 12;
        return offset;
      })();
      audioPitchShift = (audioPitchShift % 12 + 12) % 12;
      if (audioPitchShift > 6) audioPitchShift -= 12;

      if (audioPitchShift === 0) {
        pitchShiftRef.current.wet.value = 0;
      } else {
        pitchShiftRef.current.wet.value = 1;
        pitchShiftRef.current.pitch = audioPitchShift;
      }
    }
  }, [transposition, canto]);

  const togglePlay = async () => {
    if (!isAudioLoaded || !playerRef.current || !playerRef.current.buffer) return;
    await Tone.start();

        if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      offsetRef.current = Tone.now() - startTimeRef.current;
    } else {
      playerRef.current.start(0, offsetRef.current);
      setIsPlaying(true);
      startTimeRef.current = Tone.now() - offsetRef.current;
    }
  };

  const handleSeek = (percent) => {
    if (!isAudioLoaded || !playerRef.current || !playerRef.current.buffer) return;
    const newTime = percent * duration;

    offsetRef.current = newTime;

    if (isPlaying) {
      playerRef.current.stop();
      playerRef.current.start(0, newTime);
      startTimeRef.current = Tone.now() - newTime;
    }
  };

  return {
    isPlaying,
    isAudioLoaded,
    duration,
    togglePlay,
    handleSeek,
    playerRef,
    startTimeRef,
    offsetRef
  };
}
