import { useState, useEffect, useRef } from "react";
import { PitchDetector } from "pitchy";
export function useKaraoke(canto) {
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const currentMicHzRef = useRef(0);
  const [pitchData, setPitchData] = useState(null);
  const karaokeAudioCtxRef = useRef(null);
  const karaokeAnalyserRef = useRef(null);
  const karaokeStreamRef = useRef(null);
  const karaokeAnimRef = useRef(null);
  useEffect(() => {
    return () => stopKaraoke();
  }, []);
  const startKaraoke = async () => {
    try {
      if (canto && canto.audio_url) {
        const jsonUrl = `/pitch_data/${canto.audio_url.split("/").pop().replace(".mp3", ".json")}`;
        fetch(jsonUrl)
          .then((res) => res.json())
          .then((data) => setPitchData(data))
          .catch((err) => console.warn("Pitch data não encontrado", err));
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      karaokeStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      karaokeAudioCtxRef.current = audioCtx;
      karaokeAnalyserRef.current = analyser;
      setIsKaraokeMode(true);
      updateKaraokePitch();
    } catch (err) {
      console.error(err);
      throw new Error("Não foi possível acessar o microfone para o Karaoke.");
    }
  };
  const updateKaraokePitch = () => {
    const analyser = karaokeAnalyserRef.current;
    if (!analyser) return;
    const inputBuffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(inputBuffer);
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    const [pitch, clarity] = detector.findPitch(
      inputBuffer,
      karaokeAudioCtxRef.current.sampleRate,
    );
    if (clarity > 0.85 && pitch > 50 && pitch < 1000) {
      currentMicHzRef.current = Math.round(pitch * 100) / 100;
    } else {
      currentMicHzRef.current = 0;
    }
    karaokeAnimRef.current = requestAnimationFrame(updateKaraokePitch);
  };
  const stopKaraoke = () => {
    cancelAnimationFrame(karaokeAnimRef.current);
    if (karaokeStreamRef.current)
      karaokeStreamRef.current.getTracks().forEach((t) => t.stop());
    if (karaokeAudioCtxRef.current) karaokeAudioCtxRef.current.close();
    setIsKaraokeMode(false);
    currentMicHzRef.current = 0;
  };
  return {
    isKaraokeMode,
    currentMicHzRef,
    pitchData,
    startKaraoke,
    stopKaraoke,
  };
}
