import { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { PitchDetector } from "pitchy";
import { freqToNoteName } from "../utils/calibradorUtils";
const useAveragePitch = ({ onDone, AVERAGE_DURATION = 5000 }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [progress, setProgress] = useState(0);
  const [samplesCount, setSamplesCount] = useState(0);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const freqSamplesRef = useRef([]);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (!isRecording) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min(100, (elapsed / AVERAGE_DURATION) * 100));
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
    const [pitch, clarity] = detectorRef.current.findPitch(
      input,
      audioContextRef.current.sampleRate,
    );
    if (clarity > 0.75 && pitch > 50 && pitch < 1000) {
      freqSamplesRef.current.push(pitch);
      setSamplesCount(freqSamplesRef.current.length);
      setCurrentNote(freqToNote(pitch));
    }
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= AVERAGE_DURATION) {
      const samples = [...freqSamplesRef.current].sort((a, b) => a - b);
      const mid = Math.floor(samples.length / 2);
      const medianFreq =
        samples.length % 2 === 0
          ? (samples[mid - 1] + samples[mid]) / 2
          : samples[mid];
      const noteData = freqToNote(medianFreq || 0);
      cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current?.state !== "closed")
        audioContextRef.current.close();
      setIsRecording(false);
      setCurrentNote(null);
      setProgress(100);
      onDoneRef.current(noteData, samples.length, input);
      return;
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
      freqSamplesRef.current = [];
      startTimeRef.current = Date.now();
      setSamplesCount(0);
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
    freqSamplesRef.current = [];
    startTimeRef.current = null;
    setIsRecording(false);
    setCurrentNote(null);
    setProgress(0);
    setSamplesCount(0);
  };
  useEffect(() => () => stopRecording(), []);
  return {
    isRecording,
    currentNote,
    progress,
    samplesCount,
    startRecording,
    stopRecording,
    toggle: () => (isRecording ? stopRecording() : startRecording()),
  };
};
export default useAveragePitch;
