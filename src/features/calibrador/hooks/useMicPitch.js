import { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { PitchDetector } from "pitchy";
import { freqToNote, freqToNoteName } from "../utils/calibradorUtils";
const useMicPitch = ({ onNoteConfirmed, step, SUSTAIN_DURATION = 3000 }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [sustainProgress, setSustainProgress] = useState(0);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const sustainNoteRef = useRef(null);
  const sustainStartRef = useRef(null);
  const stepRef = useRef(step);
  const onNoteRef = useRef(onNoteConfirmed);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    onNoteRef.current = onNoteConfirmed;
  }, [onNoteConfirmed]);
  useEffect(() => {
    if (!isRecording) {
      setSustainProgress(0);
      return;
    }
    const interval = setInterval(() => {
      if (!sustainStartRef.current || !sustainNoteRef.current) {
        setSustainProgress(0);
        return;
      }
      const elapsed = Date.now() - sustainStartRef.current;
      setSustainProgress(Math.min(100, (elapsed / SUSTAIN_DURATION) * 100));
    }, 50);
    return () => clearInterval(interval);
  }, [isRecording]);
  const updatePitch = () => {
    if (
      !analyzerRef.current ||
      !detectorRef.current ||
      !audioContextRef.current
    )
      return;
    const input = new Float32Array(detectorRef.current.inputLength);
    analyzerRef.current.getFloatTimeDomainData(input);
    
    let sumSquares = 0;
    for (let i = 0; i < input.length; i++) {
      sumSquares += input[i] * input[i];
    }
    const rms = Math.sqrt(sumSquares / input.length);
    setVolume(rms);
    const [pitch, clarity] = detectorRef.current.findPitch(
      input,
      audioContextRef.current.sampleRate,
    );
    if (clarity > 0.8 && pitch > 50 && pitch < 1000) {
      const noteData = freqToNote(pitch);
      setCurrentNote(noteData);
      let isSameSustain = false;
      if (sustainNoteRef.current) {
        const semisOld = 12 * Math.log2(sustainNoteRef.current.freq / 440) + 69;
        const semisNew = 12 * Math.log2(pitch / 440) + 69;
        if (Math.abs(semisOld - semisNew) <= 1.5) {
          isSameSustain = true;
        }
      }
      if (isSameSustain) {
        const elapsed = Date.now() - sustainStartRef.current;
        if (elapsed >= SUSTAIN_DURATION) {
          sustainNoteRef.current = null;
          sustainStartRef.current = Date.now();
          setSustainProgress(0);
          cancelAnimationFrame(rafRef.current);
          if (audioContextRef.current?.state !== "closed")
            audioContextRef.current.close();
          setIsRecording(false);
          setCurrentNote(null);
          setSustainProgress(0);
          onNoteRef.current(noteData, stepRef.current, input);
          return;
        }
      } else {
        sustainNoteRef.current = noteData;
        sustainStartRef.current = Date.now();
        setSustainProgress(0);
      }
    } else {
      sustainNoteRef.current = null;
      sustainStartRef.current = null;
      setCurrentNote(null);
    }
    rafRef.current = requestAnimationFrame(updatePitch);
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioContextRef.current = new window.AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      detectorRef.current = PitchDetector.forFloat32Array(
        analyzerRef.current.fftSize,
      );
      sustainNoteRef.current = null;
      sustainStartRef.current = null;
      setIsRecording(true);
      updatePitch();
    } catch {
      alert("Precisamos de acesso ao microfone!");
    }
  };
  const stopRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current?.state !== "closed")
      audioContextRef.current?.close();
    sustainNoteRef.current = null;
    sustainStartRef.current = null;
    setIsRecording(false);
    setCurrentNote(null);
    setSustainProgress(0);
    setVolume(0);
  };
  useEffect(() => () => stopRecording(), []);
  return {
    isRecording,
    currentNote,
    sustainProgress,
    volume,
    startRecording,
    stopRecording,
    toggle: () => (isRecording ? stopRecording() : startRecording()),
  };
};
export default useMicPitch;
