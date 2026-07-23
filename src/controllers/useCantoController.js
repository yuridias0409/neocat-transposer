import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';
import CantoDAO from '../dao/CantoDAO';
import UserDAO from '../dao/UserDAO';
import { calcularTomIdealInteligente } from '../utils/transpositionEngine';
import { processarFeedbackEAprender } from '../utils/FeedbackEngine';
import { otimizarCapoETom } from '../utils/capoEngine';
import { getNoteIndex } from '../utils';

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

  const [aiData, setAiData] = useState(null);
  const [initialTransposition, setInitialTransposition] = useState(null);
  const [savedTransposition, setSavedTransposition] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pitchData, setPitchData] = useState(null);
  const [fontSize, setFontSize] = useState(1.1);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [aiMessage, setAiMessage] = useState('');


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
      if (canto && canto.audio_url) {
        const jsonUrl = `/pitch_data/${canto.audio_url.split('/').pop().replace('.mp3', '.json')}`;
        fetch(jsonUrl)
          .then(res => res.json())
          .then(data => setPitchData(data))
          .catch(err => console.warn('Pitch data não encontrado', err));
      }

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
    if (karaokeStreamRef.current) karaokeStreamRef.current.getTracks().forEach((t) => t.stop());
    if (karaokeAudioCtxRef.current) karaokeAudioCtxRef.current.close();
    setIsKaraokeMode(false);
    setCurrentMicHz(0);
    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      offsetRef.current = Tone.now() - startTimeRef.current;
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    if (!canto) return;

    setAiMessage('');

    const savedProfile = localStorage.getItem('userVoiceProfile');
    let profileData = null;
    if (savedProfile) {
      profileData = JSON.parse(savedProfile);
      setUserProfile(profileData);
    }

    const baseOffset = (() => {
      if (!canto?.tom_audio || !canto?.tom_original) return 0;
      let off = getNoteIndex(canto.tom_audio) - getNoteIndex(canto.tom_original);
      if (off > 6) off -= 12;
      if (off < -6) off += 12;
      return off;
    })();

    const initTone = async () => {
      let computedAiOffset = baseOffset;
      if (profileData) {
        const vozSalmista = {
          minHz: profileData.min?.freq || profileData.f0_min || 110,
          maxHz: profileData.max?.freq || profileData.f0_max || 330,
          tipoVoz: profileData.tipoVoz || 'Desconhecido'
        };
        const cantoData = await CantoDAO.getPitchMetadata(cantoId);
        const res = calcularTomIdealInteligente(vozSalmista, canto, profileData, cantoData);
        if (res) {
          computedAiOffset = res.semitones;
          computedAiOffset = ((computedAiOffset % 12) + 12) % 12;
          if (computedAiOffset > 6) computedAiOffset -= 12;

          let normalizedEsforco = res.semitonesEsforco;
          if (normalizedEsforco !== null) {
            normalizedEsforco = ((normalizedEsforco % 12) + 12) % 12;
            if (normalizedEsforco > 6) normalizedEsforco -= 12;
          }

          res.semitones = computedAiOffset;
          res.semitonesEsforco = normalizedEsforco;

          setTomEsforco(res.semitonesEsforco);
          setAiMessage(res.mensagem);
          setAiData(res);
        }
      }

      if (profileData && profileData.cantos_validados && profileData.cantos_validados[cantoId] !== undefined) {
        setTransposition(profileData.cantos_validados[cantoId]);
        setInitialTransposition(profileData.cantos_validados[cantoId]);
        setSavedTransposition(profileData.cantos_validados[cantoId]);
      } else {
        setTransposition(computedAiOffset);
        setInitialTransposition(computedAiOffset);
        setSavedTransposition(null);
      }
    };
    initTone();

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
            setProgress(elapsed / dur * 100);
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

  const salvarTomPreferido = async () => {
    if (!user) {
      showToast("Você precisa estar logado para favoritar seu tom.");
      return;
    }

    try {
      let tipoFeedback = 'OPTIMAL';
      if (initialTransposition !== null) {
        if (transposition > initialTransposition) tipoFeedback = 'TOO_LOW'; 
        else if (transposition < initialTransposition) tipoFeedback = 'TOO_HIGH'; 
      }

      await processarFeedbackEAprender({
        userId: typeof user === 'string' ? user : (user.email || user.uid),
        cantoId,
        tipoFeedback,
        tomAtualSemitons: transposition
      });

      let up = await UserDAO.getProfile(typeof user === 'string' ? user : (user.email || user.uid));
      if (!up) up = {};
      if (!up.cantos_validados) up.cantos_validados = {};
      up.cantos_validados[cantoId] = transposition;
      await UserDAO.saveProfile(typeof user === 'string' ? user : (user.email || user.uid), up);

      setSavedTransposition(transposition);
      setInitialTransposition(transposition);
      showToast("✅ Tom favoritado com sucesso! O aplicativo lembrará dessa preferência.");
    } catch (err) {
      console.error("Erro ao salvar tom", err);
      showToast("Ocorreu um erro ao favoritar seu tom.");
    }
  };




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

  const [tomEsforco, setTomEsforco] = useState(null);

  const aplicarTomInteligente = async () => {
    if (!userProfile) return;

    let computedAiOffset = 0;
    const vozSalmista = {
      minHz: userProfile.min?.freq || userProfile.f0_min || 110,
      maxHz: userProfile.max?.freq || userProfile.f0_max || 330,
      tipoVoz: userProfile.tipoVoz || 'Desconhecido'
    };
    const cantoData = await CantoDAO.getPitchMetadata(cantoId);
    const resultado = calcularTomIdealInteligente(vozSalmista, canto, userProfile, cantoData);
    if (resultado) {
      computedAiOffset = resultado.semitones;
      computedAiOffset = ((computedAiOffset % 12) + 12) % 12;
      if (computedAiOffset > 6) computedAiOffset -= 12;
      
      let normalizedEsforco = resultado.semitonesEsforco;
      if (normalizedEsforco !== null) {
        normalizedEsforco = ((normalizedEsforco % 12) + 12) % 12;
        if (normalizedEsforco > 6) normalizedEsforco -= 12;
      }

      resultado.semitones = computedAiOffset;
      resultado.semitonesEsforco = normalizedEsforco;

      setTomEsforco(resultado.semitonesEsforco);
      setAiMessage(resultado.mensagem);
      setAiData(resultado);
    }

    setTransposition(computedAiOffset);

  };


  const capoInfo = otimizarCapoETom(canto?.tom_original, transposition);

  return {
    canto,
    baseOffset: (() => {
      if (!canto?.tom_audio || !canto?.tom_original) return 0;
      let offset = getNoteIndex(canto.tom_audio) - getNoteIndex(canto.tom_original);
      if (offset > 6) offset -= 12;
      if (offset < -6) offset += 12;
      return offset;
    })(),
    transposition, setTransposition,
    aplicarTomInteligente,
    tomEsforco, setTomEsforco,
    capoInfo,
    isPlaying, togglePlay,
    isAudioLoaded, progress, currentTime, duration, handleSeek,
    userProfile,
    notes, setNotes, showNotes, setShowNotes, saveNotes,
    showChordGuide, setShowChordGuide,
    isKaraokeMode, currentMicHz, pitchData, startKaraoke, stopKaraoke,
    isGenerating, setIsGenerating,
    fontSize, setFontSize,
    toastMessage, showToast,
    aiMessage, aiData, initialTransposition, savedTransposition, isToneSaved: savedTransposition !== null && savedTransposition === transposition, salvarTomPreferido
  };
}