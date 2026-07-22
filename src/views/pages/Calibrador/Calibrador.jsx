import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, CheckCircle, ArrowRight, Guitar, ThumbsUp, ThumbsDown, User, Play, Square, UserPlus, Music2, X } from 'lucide-react';
import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';
import UserDAO from '../../../dao/UserDAO';
import './Calibrador.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";



const freqToNote = (freq) => {
  if (!freq || freq < 20) return null;
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  const h = Math.round(12 * Math.log2(freq / c0));
  const octave = Math.floor(h / 12);
  const n = (h % 12 + 12) % 12;
  return { note: notes[n], octave, name: `${notes[n]}${octave}`, freq };
};

const freqToNoteName = (freq) => {
  const n = freqToNote(freq);
  return n ? n.name : '?';
};

const getVoiceType = (minFreq) => {
  if (!minFreq) return 'Desconhecido';
  if (minFreq < 100) return 'Baixo/Barítono';
  if (minFreq < 150) return 'Tenor/Contralto';
  return 'Soprano/Mezzo';
};

const getVoiceRange = (minFreq, maxFreq) => {
  if (!minFreq || !maxFreq) return null;
  const octaves = 12 * Math.log2(maxFreq / minFreq) / 12;
  const oct = Math.floor(octaves);
  const semis = Math.round((octaves - oct) * 12);
  const octStr = oct > 0 ? ` +${oct} oit${semis > 0 ? ` ${semis}st` : ''}` : semis > 0 ? ` +${semis}st` : '';
  return `${freqToNoteName(minFreq)} → ${freqToNoteName(maxFreq)}${octStr}`;
};

const computeCombined = (calibrations) => {
  const vals = Object.values(calibrations).filter((c) => c && c.min && c.max);
  if (vals.length === 0) return null;
  const avgMin = vals.reduce((s, c) => s + c.min.freq, 0) / vals.length;
  const avgMax = vals.reduce((s, c) => s + c.max.freq, 0) / vals.length;
  return {
    min: { name: freqToNoteName(avgMin), freq: avgMin },
    max: { name: freqToNoteName(avgMax), freq: avgMax }
  };
};

const loadStorage = () => {
  try {
    const raw = localStorage.getItem('calibrationData');
    if (raw) return JSON.parse(raw);
  } catch {}

  try {
    const old = localStorage.getItem('userVoiceProfile');
    if (old) {
      const p = JSON.parse(old);
      return { calibrations: {}, combined: p };
    }
  } catch {}
  return { calibrations: {}, combined: null };
};

const saveStorage = (data) => {
  localStorage.setItem('calibrationData', JSON.stringify(data));
  if (data.combined) {
    localStorage.setItem('userVoiceProfile', JSON.stringify({ ...data.combined, learningCautela: 0 }));
  }
};

const baseFreqs = { 'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00, 'C4': 261.63, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00 };

const MODE_INFO = {
  assistant: { label: 'Salmista Assistente', desc: 'Guiado por áudio', icon: UserPlus, color: '#b91c1c' },
  mic: { label: 'Automático (Microfone)', desc: 'Cante e eu descubro', icon: Mic, color: '#b91c1c' },
  // empirical: { label: 'Prático (Com Violão)', desc: 'Toque os acordes e teste', icon: Guitar, color: '#b91c1c' },
  hum: { label: 'Cantarolar', desc: 'Cantarole e eu gravo', icon: Music2, color: '#b91c1c' }
};



const SustainBar = ({ progress, totalSeconds = 3, label }) =>
_jsxDEV("div", { style: { margin: '0.75rem auto', maxWidth: '220px' }, children: [
  _jsxDEV("div", { style: { background: '#e5e7eb', borderRadius: '99px', height: '10px', overflow: 'hidden' }, children:
    _jsxDEV("div", { style: {
        height: '100%', borderRadius: '99px',
        width: `${progress}%`,
        background: progress >= 100 ? '#16a34a' : 'var(--color-primary)',
        transition: 'width 0.05s linear'
      } }, void 0, false) }, void 0, false
  ),
  _jsxDEV("small", { style: { color: '#666', display: 'block', marginTop: '0.3rem' }, children:
    label || `Segure... ${Math.max(0, Math.ceil((100 - progress) / 100 * totalSeconds))}s` }, void 0, false
  )] }, void 0, true
);




const useMicPitch = ({ onNoteConfirmed, step, SUSTAIN_DURATION = 3000 }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [sustainProgress, setSustainProgress] = useState(0);

  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const sustainNoteRef = useRef(null);
  const sustainStartRef = useRef(null);
  const stepRef = useRef(step);
  const onNoteRef = useRef(onNoteConfirmed);

  useEffect(() => {stepRef.current = step;}, [step]);
  useEffect(() => {onNoteRef.current = onNoteConfirmed;}, [onNoteConfirmed]);


  useEffect(() => {
    if (!isRecording) {setSustainProgress(0);return;}
    const interval = setInterval(() => {
      if (!sustainStartRef.current || !sustainNoteRef.current) {setSustainProgress(0);return;}
      const elapsed = Date.now() - sustainStartRef.current;
      setSustainProgress(Math.min(100, elapsed / SUSTAIN_DURATION * 100));
    }, 50);
    return () => clearInterval(interval);
  }, [isRecording]);

  const updatePitch = () => {
    if (!analyzerRef.current || !detectorRef.current || !audioContextRef.current) return;
    const input = new Float32Array(detectorRef.current.inputLength);
    analyzerRef.current.getFloatTimeDomainData(input);
    const [pitch, clarity] = detectorRef.current.findPitch(input, audioContextRef.current.sampleRate);

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
          if (audioContextRef.current?.state !== 'closed') audioContextRef.current.close();
          setIsRecording(false);
          setCurrentNote(null);
          setSustainProgress(0);
          onNoteRef.current(noteData, stepRef.current);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new window.AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      detectorRef.current = PitchDetector.forFloat32Array(analyzerRef.current.fftSize);
      sustainNoteRef.current = null;
      sustainStartRef.current = null;
      setIsRecording(true);
      updatePitch();
    } catch {
      alert('Precisamos de acesso ao microfone!');
    }
  };

  const stopRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    sustainNoteRef.current = null;
    sustainStartRef.current = null;
    setIsRecording(false);
    setCurrentNote(null);
    setSustainProgress(0);
  };

  useEffect(() => () => stopRecording(), []);

  return { isRecording, currentNote, sustainProgress, startRecording, stopRecording,
    toggle: () => isRecording ? stopRecording() : startRecording() };
};




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

  useEffect(() => {onDoneRef.current = onDone;}, [onDone]);


  useEffect(() => {
    if (!isRecording) {setProgress(0);return;}
    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min(100, elapsed / AVERAGE_DURATION * 100));
    }, 50);
    return () => clearInterval(interval);
  }, [isRecording]);

  const updatePitch = () => {
    if (!analyzerRef.current || !detectorRef.current || !audioContextRef.current) return;
    const input = new Float32Array(detectorRef.current.inputLength);
    analyzerRef.current.getFloatTimeDomainData(input);
    const [pitch, clarity] = detectorRef.current.findPitch(input, audioContextRef.current.sampleRate);

    if (clarity > 0.75 && pitch > 50 && pitch < 1000) {
      freqSamplesRef.current.push(pitch);
      setSamplesCount(freqSamplesRef.current.length);
      setCurrentNote(freqToNote(pitch));
    }

    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= AVERAGE_DURATION) {

      const samples = [...freqSamplesRef.current].sort((a, b) => a - b);
      const mid = Math.floor(samples.length / 2);
      const medianFreq = samples.length % 2 === 0 ?
      (samples[mid - 1] + samples[mid]) / 2 :
      samples[mid];
      const noteData = freqToNote(medianFreq || 0);

      cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current?.state !== 'closed') audioContextRef.current.close();
      setIsRecording(false);
      setCurrentNote(null);
      setProgress(100);
      onDoneRef.current(noteData, samples.length);
      return;
    }

    rafRef.current = requestAnimationFrame(updatePitch);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new window.AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      detectorRef.current = PitchDetector.forFloat32Array(analyzerRef.current.fftSize);
      freqSamplesRef.current = [];
      startTimeRef.current = Date.now();
      setSamplesCount(0);
      setIsRecording(true);
      updatePitch();
    } catch {
      alert('Precisamos de acesso ao microfone!');
    }
  };

  const stopRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    freqSamplesRef.current = [];
    startTimeRef.current = null;
    setIsRecording(false);
    setCurrentNote(null);
    setProgress(0);
    setSamplesCount(0);
  };

  useEffect(() => () => stopRecording(), []);

  return { isRecording, currentNote, progress, samplesCount,
    startRecording, stopRecording,
    toggle: () => isRecording ? stopRecording() : startRecording() };
};



const HumStep = ({ title, desc, hum, savedNote, savedLabel }) =>
_jsxDEV("div", { className: "step-pane text-center", children: [
  _jsxDEV("h2", { children: title }, void 0, false),
  _jsxDEV("p", { className: "mb-4", children: desc }, void 0, false),
  _jsxDEV("div", { style: { background: '#fef9c3', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', color: '#854d0e', fontSize: '0.85rem' }, children: ["🎵 Cantarole ",
    _jsxDEV("em", { children: "\"hmmm...\"" }, void 0, false), " continuamente. O app vai tirar a média de 5 segundos!"] }, void 0, true
  ),
  _jsxDEV("div", { className: `mic-button ${hum.isRecording ? 'recording' : ''}`, onClick: hum.toggle, children:
    _jsxDEV(Music2, { size: 32 }, void 0, false) }, void 0, false
  ),
  hum.isRecording &&
  _jsxDEV("div", { style: { marginTop: '1rem' }, children: [
    hum.currentNote ?
    _jsxDEV("h1", { style: { color: 'var(--color-primary)', fontSize: '3rem', margin: '0 0 0.25rem' }, children: hum.currentNote.name }, void 0, false) :
    _jsxDEV("h1", { style: { color: '#ccc', fontSize: '3rem', margin: '0 0 0.25rem' }, children: "--" }, void 0, false),
    _jsxDEV(SustainBar, {
      progress: hum.progress,
      totalSeconds: 5,
      label: hum.progress < 100 ?
      `Coletando... ${Math.max(0, Math.ceil((100 - hum.progress) / 100 * 5))}s · ${hum.samplesCount} amostras` :
      '✅ Calculando média...' }, void 0, false
    )] }, void 0, true
  ),

  !hum.isRecording && savedNote &&
  _jsxDEV("p", { style: { color: '#666', marginTop: '1rem' }, children: ["✅ ", savedLabel, ": ", _jsxDEV("strong", { style: { color: 'var(--color-primary)' }, children: savedNote.name }, void 0, false)] }, void 0, true),

  !hum.isRecording && !savedNote &&
  _jsxDEV("p", { style: { color: '#aaa', marginTop: '1rem', fontSize: '0.9rem' }, children: "Clique no botão para começar a gravar" }, void 0, false)] }, void 0, true

);




const MicStep = ({ title, desc, mic, savedNote, savedLabel }) =>
_jsxDEV("div", { className: "step-pane text-center", children: [
  _jsxDEV("h2", { children: title }, void 0, false),
  _jsxDEV("p", { className: "mb-4", children: desc }, void 0, false),
  _jsxDEV("div", { className: `mic-button ${mic.isRecording ? 'recording' : ''}`, onClick: mic.toggle, children:
    _jsxDEV(Mic, { size: 32 }, void 0, false) }, void 0, false
  ),
  _jsxDEV("div", { className: "live-note-display mt-3", style: { minHeight: '120px' }, children: [
    mic.currentNote ?
    _jsxDEV("h1", { style: { color: 'var(--color-primary)', fontSize: '3rem', margin: 0 }, children: mic.currentNote.name }, void 0, false) :
    _jsxDEV("h1", { style: { color: '#ccc', fontSize: '3rem', margin: 0 }, children: "--" }, void 0, false),
    _jsxDEV("div", { style: { opacity: mic.isRecording && mic.currentNote ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none' }, children:
      _jsxDEV(SustainBar, { progress: mic.sustainProgress }, void 0, false) }, void 0, false
    ),
    savedNote && !mic.isRecording &&
    _jsxDEV("p", { style: { color: '#666', marginTop: '0.5rem' }, children: ["✅ ", savedLabel, ": ", _jsxDEV("strong", { children: savedNote.name }, void 0, false)] }, void 0, true)] }, void 0, true

  )] }, void 0, true
);




const SuccessScreen = ({ emoji, title, noteLabel, note, subtitle, onNext, nextLabel }) =>
_jsxDEV("div", { className: "step-pane text-center", style: { animation: 'fadeIn 0.4s ease' }, children: [
  _jsxDEV("div", { style: { fontSize: '5rem', marginBottom: '1rem' }, children: emoji }, void 0, false),
  _jsxDEV("h2", { style: { color: '#16a34a' }, children: title }, void 0, false),
  _jsxDEV("p", { style: { fontSize: '1.3rem', color: '#444' }, children: [noteLabel, " ", _jsxDEV("strong", { style: { color: 'var(--color-primary)', fontSize: '2rem' }, children: note?.name }, void 0, false)] }, void 0, true),
  subtitle && _jsxDEV("p", { style: { color: '#666', marginTop: '0.5rem' }, children: subtitle }, void 0, false),
  _jsxDEV("button", { className: "btn btn-primary mt-3", onClick: onNext, children: [
    nextLabel, " ", _jsxDEV(ArrowRight, { size: 18 }, void 0, false)] }, void 0, true
  )] }, void 0, true
);




export default function Calibrador({ user }) {
  const navigate = useNavigate();
  const [storageData, setStorageData] = useState(loadStorage);
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [noteSaved, setNoteSaved] = useState(false);
  const [minNote, setMinNote] = useState(null);
  const [maxNote, setMaxNote] = useState(null);
  const [empCapo, setEmpCapo] = useState(0);
  const [refazerModal, setRefazerModal] = useState(null);


  const [assistantGender, setAssistantGender] = useState(null);
  const [astOffsetGrave, setAstOffsetGrave] = useState(0);
  const [astOffsetAgudo, setAstOffsetAgudo] = useState(0);
  const [astPlaying, setAstPlaying] = useState(false);
  const [showFeedbackAst, setShowFeedbackAst] = useState(false);
  const astPlayerRef = useRef(null);

  const { calibrations } = storageData;


  const saveCalibration = async (modeKey, min, max) => {
    const newCals = {
      ...calibrations,
      [modeKey]: { min, max, completedAt: new Date().toISOString() }
    };
    const combined = computeCombined(newCals);
    const newData = { calibrations: newCals, combined };
    setStorageData(newData);
    saveStorage(newData);
    if (user && combined) {
      await UserDAO.saveProfile(user, combined, newData);
    }
  };


  const finishMode = (modeKey, min, max) => {
    saveCalibration(modeKey, min, max);
    setStep(99);
  };


  const mic = useMicPitch({
    step,
    onNoteConfirmed: (noteData, currentStep) => {
      if (currentStep === 2) {
        setMinNote(noteData);
        setNoteSaved('grave');
      } else if (currentStep === 3) {
        setMaxNote(noteData);
        setNoteSaved('agudo');
      }
    }
  });

  const hum = useAveragePitch({
    onDone: (noteData) => {
      if (step === 2) {
        setMinNote(noteData);
        setNoteSaved('grave');
      } else if (step === 3) {
        setMaxNote(noteData);
        setNoteSaved('agudo');
      }
    }
  });


  const startMode = (m) => {
    setMode(m);
    setStep(1);
    setNoteSaved(false);
    setMinNote(null);
    setMaxNote(null);
    setEmpCapo(0);
    setAssistantGender(null);
    setAstOffsetGrave(0);
    setAstOffsetAgudo(0);
    setRefazerModal(null);
  };


  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };


  const handleEmpiricalGrave = (ok) => {
    if (!ok) {setEmpCapo((c) => c + 1);return;}
    setMinNote({ name: 'E2 (Aprox)', freq: baseFreqs['E2'] * Math.pow(2, empCapo / 12) });
    setStep(3);
    setEmpCapo(0);
  };

  const handleEmpiricalAgudo = (ok) => {
    if (!ok) {setEmpCapo((c) => c - 1);return;}
    const max = { name: 'G4 (Aprox)', freq: baseFreqs['G4'] * Math.pow(2, empCapo / 12) };
    setMaxNote(max);
    finishMode('empirical', minNote || { name: 'E2', freq: 82 }, max);
  };


  const stopAstAudio = () => {
    if (astPlayerRef.current) {astPlayerRef.current.stop();astPlayerRef.current.dispose();astPlayerRef.current = null;}
    setAstPlaying(false);
  };

  const playAstAudio = async (songId, offset) => {
    stopAstAudio();
    await Tone.start();
    astPlayerRef.current = new Tone.Player({
      url: `/calibrador/${songId}_${offset}.mp3`,
      autostart: true,
      onload: () => setAstPlaying(true),
      onstop: () => setAstPlaying(false)
    }).toDestination();
  };

  const toggleAstAudio = (songId, offset) => astPlaying ? stopAstAudio() : playAstAudio(songId, offset);

  const handleAstGender = (gender) => {setAssistantGender(gender);setStep(1.5);};

  const handleAstRange = (rangeType) => {
    if (assistantGender === 'male') {
      if (rangeType === 'high') {setAstOffsetGrave(-1);setAstOffsetAgudo(3);}
      if (rangeType === 'normal') {setAstOffsetGrave(-3);setAstOffsetAgudo(0);}
      if (rangeType === 'low') {setAstOffsetGrave(-5);setAstOffsetAgudo(-2);}
    } else {
      if (rangeType === 'high') {setAstOffsetGrave(2);setAstOffsetAgudo(8);}
      if (rangeType === 'normal') {setAstOffsetGrave(0);setAstOffsetAgudo(5);}
      if (rangeType === 'low') {setAstOffsetGrave(-2);setAstOffsetAgudo(3);}
    }
    setStep(2);
  };

  const astGraveSim = () => {
    setShowFeedbackAst(true);
    setTimeout(() => {
      setShowFeedbackAst(false);
      if (astOffsetGrave > -10) {setAstOffsetGrave((p) => p - 1);stopAstAudio();playAstAudio('769', astOffsetGrave - 1);} else
      {stopAstAudio();setStep(3);}
    }, 800);
  };

  const astGraveNao = () => {stopAstAudio();setStep(3);};

  const astAgudoSim = () => {
    setShowFeedbackAst(true);
    setTimeout(() => {
      setShowFeedbackAst(false);
      if (astOffsetAgudo < 8) {setAstOffsetAgudo((p) => p + 1);stopAstAudio();playAstAudio('824', astOffsetAgudo + 1);} else
      {stopAstAudio();astFinish();}
    }, 800);
  };

  const astAgudoNao = () => {stopAstAudio();astFinish();};

  const astFinish = () => {
    const minF = 82.41 * Math.pow(2, astOffsetGrave / 12);
    const maxF = 392.00 * Math.pow(2, astOffsetAgudo / 12);
    const min = { name: freqToNoteName(minF), freq: minF };
    const max = { name: freqToNoteName(maxF), freq: maxF };
    finishMode('assistant', min, max);
  };


  const getRecommendation = () => {
    const done = Object.keys(calibrations);
    if (done.length === 0) return null;
    if (done.includes('assistant') && !done.includes('mic')) return { mode: 'mic', msg: 'Confirme com o microfone!' };
    if (done.includes('mic') && !done.includes('assistant')) return { mode: 'assistant', msg: 'Use o Assistente para comparar.' };
    if (!done.includes('hum')) return { mode: 'hum', msg: 'Cantarole para uma validação rápida.' };
    return null;
  };
  const recommendation = getRecommendation();




  if (!mode) {
    const totalDone = Object.keys(calibrations).length;

    return (
      _jsxDEV("div", { className: "container calibrador-page", style: { maxWidth: '680px' }, children: [
        refazerModal &&
        _jsxDEV("div", { style: {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }, children:
          _jsxDEV("div", { className: "card", style: { maxWidth: '360px', width: '90%', padding: '2rem', textAlign: 'center' }, children: [
            _jsxDEV("h3", { style: { marginBottom: '0.5rem' }, children: "Ajustar calibração?" }, void 0, false),
            _jsxDEV("p", { style: { color: '#666', marginBottom: '1.5rem' }, children: ["O que você deseja fazer com o teste de ",
              _jsxDEV("strong", { children: MODE_INFO[refazerModal]?.label }, void 0, false), "?"] }, void 0, true
            ),
            _jsxDEV("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [
              _jsxDEV("button", { className: "btn btn-primary", onClick: () => startMode(refazerModal), children: "Refazer Teste ✓" }, void 0, false),
              _jsxDEV("button", { className: "btn btn-outline", style: { borderColor: 'var(--color-danger)', color: 'var(--color-danger)' },
                onClick: () => {
                  const newCals = { ...calibrations };
                  delete newCals[refazerModal];
                  const combined = computeCombined(newCals);
                  const newData = { calibrations: newCals, combined };
                  setStorageData(newData);
                  saveStorage(newData);
                  setRefazerModal(null);
                }, children: "Remover Calibração" }, void 0, false

              ),
              _jsxDEV("button", { className: "btn btn-outline", style: { marginTop: '0.5rem' }, onClick: () => setRefazerModal(null), children: "Cancelar" }, void 0, false)] }, void 0, true
            )] }, void 0, true
          ) }, void 0, false
        ),


        _jsxDEV("div", { className: "calibrador-card card text-center", children: [
          _jsxDEV("h2", { children: "Como você prefere calibrar sua voz?" }, void 0, false),
          totalDone > 0 &&
          _jsxDEV("p", { style: { color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }, children: [
            totalDone, " teste", totalDone > 1 ? 's' : '', " concluído", totalDone > 1 ? 's' : '', " · Clique em um concluído para refazer"] }, void 0, true
          ),


          _jsxDEV("div", { className: "mode-selection mt-4", children:
            Object.entries(MODE_INFO).map(([key, info]) => {
              const done = calibrations[key];
              const Icon = info.icon;
              if (done) {
                const range = getVoiceRange(done.min?.freq, done.max?.freq);
                const vtype = getVoiceType(done.min?.freq);
                return (
                  _jsxDEV("button", { onClick: () => setRefazerModal(key),
                    style: {
                      flexDirection: 'column', padding: '1.5rem 1rem',
                      background: 'var(--color-bg-secondary)',
                      border: '2px solid var(--color-secondary)', borderRadius: '12px', color: 'var(--color-text-main)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', textAlign: 'center',
                      boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }, children: [
                    _jsxDEV("div", { style: { background: 'rgba(31, 60, 109, 0.1)', borderRadius: '50%', padding: '0.75rem', marginBottom: '0.75rem' }, children:
                      _jsxDEV(Icon, { size: 36, color: "var(--color-secondary)" }, void 0, false) }, void 0, false
                    ),
                    _jsxDEV("span", { style: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-secondary)' }, children: "✓ Concluído" }, void 0, false),
                    _jsxDEV("strong", { style: { fontSize: '1.2rem', marginTop: '0.25rem', display: 'block', color: 'var(--color-primary)' }, children: info.label }, void 0, false),
                    _jsxDEV("span", { style: { fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-secondary)', marginTop: '0.35rem' }, children: vtype }, void 0, false),
                    range && _jsxDEV("span", { style: { fontSize: '0.9rem', color: '#444', marginTop: '0.2rem' }, children: ["🎵 ", range] }, void 0, true)] }, key, true
                  ));

              }
              return (
                _jsxDEV("button", { className: "btn btn-outline",
                  style: { flexDirection: 'column', padding: '1.5rem 1rem', display: 'flex', alignItems: 'center' },
                  onClick: () => startMode(key), children: [
                  _jsxDEV(Icon, { size: 56, className: "mb-2", style: { color: info.color } }, void 0, false),
                  _jsxDEV("strong", { style: { fontSize: '1.05rem' }, children: info.label }, void 0, false),
                  _jsxDEV("span", { style: { display: 'block', marginTop: '0.4rem', color: '#666', fontSize: '0.9rem' }, children: info.desc }, void 0, false)] }, key, true
                ));

            }) }, void 0, false
          ),


          recommendation &&
          _jsxDEV("div", { style: { marginTop: '1.5rem', padding: '1rem', background: '#fef9c3', borderRadius: '10px', border: '1px solid #fde047', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }, children: [
            _jsxDEV("span", { style: { fontSize: '1.5rem' }, children: "💡" }, void 0, false),
            _jsxDEV("div", { children: [
              _jsxDEV("strong", { children: "Sugestão:" }, void 0, false), " ", recommendation.msg,
              _jsxDEV("button", { className: "btn btn-sm btn-outline", style: { marginLeft: '0.75rem', borderColor: '#854d0e', color: '#854d0e' },
                onClick: () => startMode(recommendation.mode), children: "Fazer agora" }, void 0, false

              )] }, void 0, true
            )] }, void 0, true
          ),



          storageData.combined &&
          _jsxDEV("div", { style: { marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac', color: '#166534' }, children: [
            _jsxDEV("strong", { children: ["🎼 Perfil combinado (", Object.keys(calibrations).length, " testes):"] }, void 0, true),
            _jsxDEV("div", { style: { marginTop: '0.25rem', fontSize: '1.05rem' }, children: [
              getVoiceType(storageData.combined.min?.freq), " · ", getVoiceRange(storageData.combined.min?.freq, storageData.combined.max?.freq)] }, void 0, true
            )] }, void 0, true
          ),


          totalDone > 0 &&
          _jsxDEV("div", { style: { marginTop: '1.5rem' }, children:
            _jsxDEV(Link, { to: "/", className: "btn btn-primary", style: { width: '100%', maxWidth: '300px' }, children: ["Ir para os cantos ",
              _jsxDEV(ArrowRight, { size: 18, style: { marginLeft: '0.5rem' } }, void 0, false)] }, void 0, true
            ) }, void 0, false
          )] }, void 0, true

        )] }, void 0, true
      ));

  }






  if (step === 99) {
    const cal = calibrations[mode];
    return (
      _jsxDEV("div", { className: "container calibrador-page", children:
        _jsxDEV("div", { className: "calibrador-card card text-center", children: [
          _jsxDEV("div", { className: "icon-wrapper success mb-4", children: _jsxDEV(CheckCircle, { size: 64 }, void 0, false) }, void 0, false),
          _jsxDEV("h2", { children: "Perfil Salvo!" }, void 0, false),
          cal &&
          _jsxDEV("p", { style: { fontSize: '1.1rem', color: '#444', marginBottom: '0.5rem' }, children: [
            _jsxDEV("strong", { children: getVoiceType(cal.min?.freq) }, void 0, false), " · ", getVoiceRange(cal.min?.freq, cal.max?.freq)] }, void 0, true
          ),

          Object.keys(calibrations).length > 1 && storageData.combined &&
          _jsxDEV("p", { style: { color: '#666', fontSize: '0.9rem' }, children: ["Média de ",
            Object.keys(calibrations).length, " testes: ", getVoiceRange(storageData.combined.min?.freq, storageData.combined.max?.freq)] }, void 0, true
          ),

          _jsxDEV("p", { className: "mb-4", style: { color: '#666' }, children: "A IA ajustará as cifras para você." }, void 0, false),
          _jsxDEV("div", { style: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }, children: [
            _jsxDEV("button", { className: "btn btn-outline", onClick: () => {setMode(null);}, children: "Fazer outro teste" }, void 0, false),
            _jsxDEV("button", { className: "btn btn-secondary", onClick: () => navigate('/'), children: "Voltar aos Cantos" }, void 0, false)] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      ));

  }

  return (
    _jsxDEV("div", { className: "container calibrador-page", children:
      _jsxDEV("div", { className: "calibrador-card card", children: [

        _jsxDEV("button", { onClick: () => {mic.stopRecording();setMode(null);},
          style: { background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: "← Voltar à seleção" }, void 0, false

        ),


        mode !== 'assistant' &&
        _jsxDEV("div", { className: "steps-indicator", children:
          [1, 2, 3, 4].map((s, i, arr) =>
          _jsxDEV(React.Fragment, { children: [
            _jsxDEV("div", { className: `step-dot ${step >= s ? 'active' : ''}` }, void 0, false),
            i < arr.length - 1 && _jsxDEV("div", { className: "step-line" }, void 0, false)] }, s, true
          )
          ) }, void 0, false
        ),


        _jsxDEV("div", { className: "calibrador-content", children: [


          mode === 'assistant' && step === 1 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Assistente de medição de voz" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: "Para começar, escolha uma dessas opções:" }, void 0, false),
            _jsxDEV("div", { style: { display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }, children: [
              _jsxDEV("button", { className: "btn btn-outline", style: { padding: '3.5rem 3rem', flexDirection: 'column', flex: '1 1 220px', maxWidth: '300px' }, onClick: () => handleAstGender('male'), children: [
                _jsxDEV("span", { style: { color: '#b91c1c', fontSize: '1.2rem', fontWeight: 500 }, children: "Tenho voz de" }, void 0, false),
                _jsxDEV("h2", { style: { margin: 0, color: '#b91c1c', marginTop: '0.75rem', fontSize: '2.2rem' }, children: "HOMEM" }, void 0, false)] }, void 0, true
              ),
              _jsxDEV("button", { className: "btn btn-outline", style: { padding: '3.5rem 3rem', flexDirection: 'column', flex: '1 1 220px', maxWidth: '300px' }, onClick: () => handleAstGender('female'), children: [
                _jsxDEV("span", { style: { color: '#b91c1c', fontSize: '1.2rem', fontWeight: 500 }, children: "Tenho voz de" }, void 0, false),
                _jsxDEV("h2", { style: { margin: 0, color: '#b91c1c', marginTop: '0.75rem', fontSize: '2.2rem' }, children: "MULHER" }, void 0, false)] }, void 0, true
              )] }, void 0, true
            )] }, void 0, true
          ),


          mode === 'assistant' && step === 1.5 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Assistente de medição de voz" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: "Escolha a opção que melhor te descreve:" }, void 0, false),
            _jsxDEV("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '520px', margin: '0 auto' }, children:
              [
              { key: 'normal', label: 'Nem mais aguda nem mais grave que a maioria / Não sei' },
              { key: 'high', label: 'Minha voz é mais aguda do que a maioria' },
              { key: 'low', label: 'Minha voz é mais grave do que a maioria' }].
              map((o) =>
              _jsxDEV("button", { className: "btn btn-outline", style: { justifyContent: 'flex-start', textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '1.15rem' },
                onClick: () => handleAstRange(o.key), children:
                _jsxDEV("span", { style: { color: '#b91c1c', fontWeight: 600 }, children: [o.label, " →"] }, void 0, true) }, o.key, false
              )
              ) }, void 0, false
            )] }, void 0, true
          ),


          mode === 'assistant' && step === 2 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Passo 2: vamos encontrar sua nota mais grave" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: "Tente cantar a seguinte estrofe com o áudio de referência." }, void 0, false),
            _jsxDEV("div", { className: "sheet-preview", style: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', maxWidth: '400px', margin: '0 auto' }, children: [
              _jsxDEV("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1rem' }, children: [
                _jsxDEV("strong", { style: { color: '#b91c1c' }, children: "Cante assim:" }, void 0, false),
                _jsxDEV("button", { className: "btn btn-primary", style: { padding: '0.5rem' }, onClick: () => toggleAstAudio('769', astOffsetGrave), children:
                  astPlaying ? _jsxDEV(Square, { size: 18 }, void 0, false) : _jsxDEV(Play, { size: 18 }, void 0, false) }, void 0, false
                )] }, void 0, true
              ),
              _jsxDEV("h4", { style: { color: '#b91c1c', textAlign: 'center' }, children: "IAHWEH, TU ÉS MEU DEUS" }, void 0, false),
              _jsxDEV("div", { style: { fontFamily: 'monospace', fontSize: '1.1rem', marginTop: '1.5rem', lineHeight: 2 }, children: [
                _jsxDEV("span", { style: { color: '#b91c1c' }, children: "Mi-" }, void 0, false), '                 ', _jsxDEV("span", { style: { color: '#b91c1c' }, children: "Si7" }, void 0, false), _jsxDEV("br", {}, void 0, false), "IAHWEH, TU ÉS MEU DEUS,",
                _jsxDEV("br", {}, void 0, false), _jsxDEV("br", {}, void 0, false),
                '           ', _jsxDEV("span", { style: { color: '#b91c1c' }, children: "Mi-" }, void 0, false), _jsxDEV("br", {}, void 0, false), "EU TE LOUVAREI."] }, void 0, true
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "mt-4", children: [
              _jsxDEV("p", { style: { fontSize: '1.2rem' }, children: "Conseguiu cantar?" }, void 0, false),
              showFeedbackAst ?
              _jsxDEV("div", { style: { color: 'green', fontWeight: 'bold', fontSize: '1.2rem' }, children: [_jsxDEV(CheckCircle, { size: 24, style: { verticalAlign: 'text-bottom', marginRight: '0.5rem' } }, void 0, false), "Excelente! Ajustando..."] }, void 0, true) :
              _jsxDEV("div", { style: { display: 'flex', gap: '1rem', justifyContent: 'center' }, children: [
                _jsxDEV("button", { className: "btn btn-outline", style: { borderColor: 'green', color: 'green' }, onClick: astGraveSim, children: "Sim" }, void 0, false),
                _jsxDEV("button", { className: "btn btn-outline", style: { borderColor: '#b91c1c', color: '#b91c1c' }, onClick: astGraveNao, children: "Não, é muito grave" }, void 0, false)] }, void 0, true
              )] }, void 0, true

            )] }, void 0, true
          ),


          mode === 'assistant' && step === 3 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Passo 3: vamos encontrar sua nota mais aguda" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: "Tente cantar a estrofe abaixo. Atenção: cante forte, mas sem gritar!" }, void 0, false),
            _jsxDEV("div", { className: "sheet-preview", style: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', maxWidth: '400px', margin: '0 auto' }, children: [
              _jsxDEV("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1rem' }, children: [
                _jsxDEV("strong", { style: { color: '#b91c1c' }, children: "Cante assim:" }, void 0, false),
                _jsxDEV("button", { className: "btn btn-primary", style: { padding: '0.5rem' }, onClick: () => toggleAstAudio('824', astOffsetAgudo), children:
                  astPlaying ? _jsxDEV(Square, { size: 18 }, void 0, false) : _jsxDEV(Play, { size: 18 }, void 0, false) }, void 0, false
                )] }, void 0, true
              ),
              _jsxDEV("h4", { style: { color: '#b91c1c', textAlign: 'center' }, children: "SE O SENHOR NÃO CONSTRÓI A CASA" }, void 0, false),
              _jsxDEV("div", { style: { fontFamily: 'monospace', fontSize: '1.1rem', marginTop: '1.5rem', lineHeight: 2 }, children: [
                _jsxDEV("span", { style: { color: '#b91c1c' }, children: "Do" }, void 0, false), '                  ', _jsxDEV("span", { style: { color: '#b91c1c' }, children: "La-" }, void 0, false), '    ', _jsxDEV("span", { style: { color: '#b91c1c' }, children: "Fa" }, void 0, false), _jsxDEV("br", {}, void 0, false), "SE O SENHOR NÃO CONSTRÓI A CASA,",
                _jsxDEV("br", {}, void 0, false), _jsxDEV("br", {}, void 0, false),
                '   ', _jsxDEV("span", { style: { color: '#b91c1c' }, children: "Mi" }, void 0, false), '                      ', _jsxDEV("span", { style: { color: '#b91c1c' }, children: "La-" }, void 0, false), _jsxDEV("br", {}, void 0, false), "EM VÃO TRABALHAM OS CONSTRUTORES."] }, void 0, true

              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "mt-4", children: [
              _jsxDEV("p", { style: { fontSize: '1.2rem' }, children: "Conseguiu cantar?" }, void 0, false),
              showFeedbackAst ?
              _jsxDEV("div", { style: { color: 'green', fontWeight: 'bold', fontSize: '1.2rem' }, children: [_jsxDEV(CheckCircle, { size: 24, style: { verticalAlign: 'text-bottom', marginRight: '0.5rem' } }, void 0, false), "Muito bom! Ajustando..."] }, void 0, true) :
              _jsxDEV("div", { style: { display: 'flex', gap: '1rem', justifyContent: 'center' }, children: [
                _jsxDEV("button", { className: "btn btn-outline", style: { borderColor: 'green', color: 'green' }, onClick: astAgudoSim, children: "Sim" }, void 0, false),
                _jsxDEV("button", { className: "btn btn-outline", style: { borderColor: '#b91c1c', color: '#b91c1c' }, onClick: astAgudoNao, children: "Não, é muito agudo" }, void 0, false)] }, void 0, true
              )] }, void 0, true

            )] }, void 0, true
          ),



          mode === 'mic' && step === 1 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Teste por Microfone" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: "Vamos descobrir sua extensão vocal pelo microfone. Você vai cantar sua nota mais grave e depois a mais aguda." }, void 0, false

            ),
            _jsxDEV("div", { style: { background: '#fef9c3', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', color: '#854d0e', fontSize: '0.9rem' }, children: ["💡 Dica: mantenha cada nota por ",
              _jsxDEV("strong", { children: "3 segundos" }, void 0, false), " para que ela seja registrada."] }, void 0, true
            ),
            _jsxDEV("button", { className: "btn btn-primary", onClick: () => setStep(2), children: ["Começar ",
              _jsxDEV(ArrowRight, { size: 18 }, void 0, false)] }, void 0, true
            )] }, void 0, true
          ),


          mode === 'mic' && step === 2 && !noteSaved &&
          _jsxDEV(MicStep, {
            title: "Teste do Grave",
            desc: "Cante a nota mais grave que consegue com conforto e mantenha por 3 segundos.",
            mic: mic,
            savedNote: minNote,
            savedLabel: "Nota Mais Grave Salva" }, void 0, false
          ),


          mode === 'mic' && step === 2 && noteSaved === 'grave' &&
          _jsxDEV(SuccessScreen, {
            emoji: "✅", title: "Nota Grave Salva!",
            noteLabel: "Sua nota mais grave é", note: minNote,
            subtitle: "Agora vamos para o agudo...",
            onNext: () => {setNoteSaved(false);setStep(3);},
            nextLabel: "Ir para o Agudo" }, void 0, false
          ),


          mode === 'mic' && step === 3 && !noteSaved &&
          _jsxDEV(MicStep, {
            title: "Teste do Agudo",
            desc: "Agora cante a nota mais aguda que alcança sem esforço e mantenha por 3 segundos.",
            mic: mic,
            savedNote: maxNote,
            savedLabel: "Nota Mais Aguda Salva" }, void 0, false
          ),


          mode === 'mic' && step === 3 && noteSaved === 'agudo' &&
          _jsxDEV(SuccessScreen, {
            emoji: "🎉", title: "Nota Aguda Salva!",
            noteLabel: "Sua nota mais aguda é", note: maxNote,
            subtitle: "Calibração concluída!",
            onNext: () => {setNoteSaved(false);finishMode(mode, minNote, maxNote);},
            nextLabel: "Ver Resultado" }, void 0, false
          ),



          mode === 'hum' && step === 1 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Cantarolar" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: "Vamos captar seu alcance vocal pelo cantarolar. Você vai cantarolar (hmm...) grave e depois agudo." }, void 0, false

            ),
            _jsxDEV("button", { className: "btn btn-primary", onClick: () => setStep(2), children: ["Começar ",
              _jsxDEV(ArrowRight, { size: 18 }, void 0, false)] }, void 0, true
            )] }, void 0, true
          ),


          mode === 'hum' && step === 2 && !noteSaved &&
          _jsxDEV(HumStep, {
            title: "Cantarole o Grave",
            desc: "Cantarole (hmm...) a nota mais grave que você consegue com conforto.",
            hum: hum,
            savedNote: minNote,
            savedLabel: "Nota Grave de Cantarolar Salva" }, void 0, false
          ),


          mode === 'hum' && step === 2 && noteSaved === 'grave' &&
          _jsxDEV(SuccessScreen, {
            emoji: "✅", title: "Média Grave Registrada!",
            noteLabel: "A média do cantarolar grave deu", note: minNote,
            subtitle: "Prepare-se para o cantarolar agudo...",
            onNext: () => {setNoteSaved(false);setStep(3);},
            nextLabel: "Ir para o Agudo" }, void 0, false
          ),


          mode === 'hum' && step === 3 && !noteSaved &&
          _jsxDEV(HumStep, {
            title: "Cantarole o Agudo",
            desc: "Agora cantarole (hmm...) a nota mais aguda que você alcança com conforto.",
            hum: hum,
            savedNote: maxNote,
            savedLabel: "Nota Aguda de Cantarolar Salva" }, void 0, false
          ),


          mode === 'hum' && step === 3 && noteSaved === 'agudo' &&
          _jsxDEV(SuccessScreen, {
            emoji: "🎉", title: "Média Aguda Registrada!",
            noteLabel: "A média do cantarolar agudo deu", note: maxNote,
            subtitle: "Calibração por cantarolar finalizada!",
            onNext: () => {setNoteSaved(false);finishMode(mode, minNote, maxNote);},
            nextLabel: "Ver Resultado" }, void 0, false
          ),



          mode === 'empirical' && step === 1 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Bem-vindo ao Calibrador" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: "Vamos descobrir a sua extensão vocal com o violão." }, void 0, false),
            _jsxDEV("button", { className: "btn btn-primary", onClick: () => setStep(2), children: ["Começar ", _jsxDEV(ArrowRight, { size: 18 }, void 0, false)] }, void 0, true)] }, void 0, true
          ),


          mode === 'empirical' && step === 2 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Passo 2: Hora do Grave" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: ["Toque ", _jsxDEV("strong", { children: "Lá Menor (Am)" }, void 0, false), " ", empCapo === 0 ? _jsxDEV("strong", { children: "sem capotraste" }, void 0, false) : _jsxDEV("span", { children: ["com capotraste na ", _jsxDEV("strong", { children: ["casa ", empCapo] }, void 0, true)] }, void 0, true), " e cante bem grave."] }, void 0, true),
            _jsxDEV("div", { style: { padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1.5rem' }, children:
              _jsxDEV("code", { children: "[Am] A voz do meu a[E]mado..." }, void 0, false) }, void 0, false
            ),
            _jsxDEV("p", { children: "O afinador confirmou seu grave?" }, void 0, false),
            _jsxDEV("div", { style: { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }, children: [
              _jsxDEV("button", { className: "btn btn-outline", onClick: () => handleEmpiricalGrave(false), children: [_jsxDEV(ThumbsDown, { size: 18 }, void 0, false), " Não, subir capo"] }, void 0, true),
              _jsxDEV("button", { className: "btn btn-primary", onClick: () => handleEmpiricalGrave(true), children: [_jsxDEV(ThumbsUp, { size: 18 }, void 0, false), " Sim, cravei a nota!"] }, void 0, true)] }, void 0, true
            )] }, void 0, true
          ),


          mode === 'empirical' && step === 3 &&
          _jsxDEV("div", { className: "step-pane text-center", children: [
            _jsxDEV("h2", { children: "Passo 3: Hora do Agudo" }, void 0, false),
            _jsxDEV("p", { className: "mb-4", children: ["Toque ", _jsxDEV("strong", { children: "Dó Maior (C)" }, void 0, false), " ", empCapo <= 0 ? _jsxDEV("strong", { children: "sem capotraste" }, void 0, false) : _jsxDEV("span", { children: ["com capotraste na ", _jsxDEV("strong", { children: ["casa ", empCapo] }, void 0, true)] }, void 0, true), " e tente alcançar o agudo."] }, void 0, true),
            _jsxDEV("div", { style: { padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1.5rem', fontFamily: 'monospace' }, children: [
              _jsxDEV("span", { style: { color: 'var(--color-primary)' }, children: "Do" }, void 0, false), '           ', _jsxDEV("span", { style: { color: 'var(--color-primary)' }, children: "La-" }, void 0, false), '     ', _jsxDEV("span", { style: { color: 'var(--color-primary)' }, children: "Fa" }, void 0, false), _jsxDEV("br", {}, void 0, false), "SE O SENHOR NÃO CONSTRÓI A CASA"] }, void 0, true

            ),
            _jsxDEV("p", { children: "Conseguiu alcançar?" }, void 0, false),
            _jsxDEV("div", { style: { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }, children: [
              _jsxDEV("button", { className: "btn btn-outline", onClick: () => handleEmpiricalAgudo(false), children: [_jsxDEV(ThumbsDown, { size: 18 }, void 0, false), " Não alcanço, baixar capo"] }, void 0, true),
              _jsxDEV("button", { className: "btn btn-primary", onClick: () => handleEmpiricalAgudo(true), children: [_jsxDEV(ThumbsUp, { size: 18 }, void 0, false), " Sim, cravei a nota!"] }, void 0, true)] }, void 0, true
            )] }, void 0, true
          )] }, void 0, true


        )] }, void 0, true
      ) }, void 0, false
    ));

};

