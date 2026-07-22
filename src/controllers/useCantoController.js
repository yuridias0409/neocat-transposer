import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';
import CantoDAO from '../dao/CantoDAO';
import UserDAO from '../dao/UserDAO';

export function useCantoController(cantoId, user) {
  const canto = CantoDAO.getById(cantoId);
  
  const [transposition, setTransposition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showChordGuide, setShowChordGuide] = useState(false);
  
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [currentMicHz, setCurrentMicHz] = useState(0);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontSize, setFontSize] = useState(1.1);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animationRef = useRef(null);
  
  const karaokeAudioCtxRef = useRef(null);
  const karaokeAnalyserRef = useRef(null);
  const karaokeStreamRef = useRef(null);
  const karaokeAnimRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    return () => stopKaraoke();
  }, []);

  const startKaraoke = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      
      if (!isPlaying) {
        togglePlay();
      }
    } catch (err) {
      console.error(err);
      showToast("Não foi possível acessar o microfone para o Karaoke.");
    }
  };

  const updateKaraokePitch = () => {
    const analyser = karaokeAnalyserRef.current;
    if (!analyser) return;

    const inputBuffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(inputBuffer);

    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    const [pitch, clarity] = detector.findPitch(inputBuffer, karaokeAudioCtxRef.current.sampleRate);

    if (clarity > 0.85 && pitch > 50 && pitch < 1000) {
      setCurrentMicHz(Math.round(pitch * 100) / 100);
    } else {
      setCurrentMicHz(0); 
    }
    karaokeAnimRef.current = requestAnimationFrame(updateKaraokePitch);
  };

  const stopKaraoke = () => {
    cancelAnimationFrame(karaokeAnimRef.current);
    if (karaokeStreamRef.current) karaokeStreamRef.current.getTracks().forEach(t => t.stop());
    if (karaokeAudioCtxRef.current) karaokeAudioCtxRef.current.close();
    setIsKaraokeMode(false);
    setCurrentMicHz(0);
  };

  useEffect(() => {
    if (!canto) return;
    
    setTransposition(0);

    const savedProfile = localStorage.getItem('userVoiceProfile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
    if (canto.audio_url) {
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
          setDuration(playerRef.current.buffer.duration);
        }
      }).connect(pitchShiftRef.current);
    }

    return () => {
      if (playerRef.current) playerRef.current.dispose();
      if (pitchShiftRef.current) pitchShiftRef.current.dispose();
      cancelAnimationFrame(animationRef.current);
    };
  }, [canto, cantoId, user]);

  useEffect(() => {
    if (pitchShiftRef.current && canto) {
      let audioPitchShift = transposition;
      audioPitchShift = ((audioPitchShift % 12) + 12) % 12;
      if (audioPitchShift > 6) audioPitchShift -= 12;

      if (audioPitchShift === 0) {
        pitchShiftRef.current.wet.value = 0;
      } else {
        pitchShiftRef.current.wet.value = 1;
        pitchShiftRef.current.pitch = audioPitchShift;
      }
    }
    if (transposition !== 0 && !feedbackSent) setShowFeedback(true);
  }, [transposition, canto, feedbackSent]);

  const togglePlay = async () => {
    if (!isAudioLoaded || !playerRef.current || !playerRef.current.buffer) return;
    await Tone.start(); 
    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      offsetRef.current = Tone.now() - startTimeRef.current;
      cancelAnimationFrame(animationRef.current);
    } else {
      playerRef.current.start(0, offsetRef.current);
      setIsPlaying(true);
      startTimeRef.current = Tone.now() - offsetRef.current;
      
      const updateProgress = () => {
        if (playerRef.current && playerRef.current.state === "started") {
          const elapsed = Tone.now() - startTimeRef.current;
          const dur = playerRef.current.buffer.duration;
          if (dur > 0) {
            if (elapsed >= dur) {
              setIsPlaying(false);
              setProgress(0);
              setCurrentTime(0);
              offsetRef.current = 0;
              playerRef.current.stop();
              return;
            }
            setProgress((elapsed / dur) * 100);
            setCurrentTime(elapsed);
          }
          animationRef.current = requestAnimationFrame(updateProgress);
        }
      };
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleSeek = (e) => {
    if (!isAudioLoaded || !playerRef.current || !playerRef.current.buffer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    offsetRef.current = newTime;
    setProgress(percent * 100);
    setCurrentTime(newTime);
    
    if (isPlaying) {
      playerRef.current.stop();
      playerRef.current.start(0, newTime);
      startTimeRef.current = Tone.now() - newTime;
    }
  };

  const handleFeedback = (isGood) => {
    setFeedbackSent(true);
    setShowFeedback(false);
    showToast(isGood ? "Ótimo! O app lembrará dessa preferência." : "Obrigado pelo aviso. Ajustaremos nosso algoritmo!");
  };

  // -----------------------------------------------------
  // ANOTAÇÕES PESSOAIS DA MÚSICA (Sincronizado via DAO)
  // -----------------------------------------------------
  useEffect(() => {
    async function loadNotes() {
      if (user && cantoId) {
        const text = await UserDAO.getNote(user, cantoId);
        setNotes(text);
        if (text) setShowNotes(true);
      }
    }
    loadNotes();
  }, [cantoId, user]);

  const saveNotes = async () => {
    if (user && cantoId) {
      await UserDAO.saveNote(user, cantoId, notes);
      showToast("Anotações salvas com sucesso!");
    }
  };

  return {
    canto,
    transposition, setTransposition,
    isPlaying, togglePlay,
    isAudioLoaded, progress, currentTime, duration, handleSeek,
    userProfile,
    notes, setNotes, showNotes, setShowNotes, saveNotes,
    showChordGuide, setShowChordGuide,
    isKaraokeMode, currentMicHz, startKaraoke, stopKaraoke,
    showFeedback, feedbackSent, handleFeedback,
    isGenerating, setIsGenerating,
    fontSize, setFontSize,
    toastMessage, showToast
  };
}
