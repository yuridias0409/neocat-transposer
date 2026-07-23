import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CantoDAO from '../dao/CantoDAO';
import UserDAO from '../dao/UserDAO';
import { calcularTomIdealInteligente } from '../utils/transpositionEngine';
import { processarFeedbackEAprender } from '../utils/FeedbackEngine';
import { otimizarCapoETom } from '../utils/capoEngine';
import { getNoteIndex } from '../utils';

import { useAudioPlayer } from './useAudioPlayer';
import { useKaraoke } from './useKaraoke';

export function useCantoController(cantoId, user) {
  const canto = CantoDAO.getById(cantoId);
  const location = useLocation();
  const precomputedOffset = location.state?.precomputedOffset;

  const [transposition, setTransposition] = useState(precomputedOffset !== undefined ? precomputedOffset : 0);
  const [userProfile, setUserProfile] = useState(null);

  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(window.innerWidth >= 768);
  const [showChordGuide, setShowChordGuide] = useState(false);

  const [aiData, setAiData] = useState(null);
  const [initialTransposition, setInitialTransposition] = useState(precomputedOffset !== undefined ? precomputedOffset : null);
  const [savedTransposition, setSavedTransposition] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontSize, setFontSize] = useState(1.1);
  const [toastMessage, setToastMessage] = useState(null);

  const [aiMessage, setAiMessage] = useState('');
  const [tomEsforco, setTomEsforco] = useState(null);

  const audioPlayer = useAudioPlayer(canto, transposition);
  const karaoke = useKaraoke(canto);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
  }, [canto, cantoId, user]);

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
    ...audioPlayer,
    ...karaoke,
    userProfile,
    notes, setNotes, showNotes, setShowNotes, saveNotes,
    showChordGuide, setShowChordGuide,
    isGenerating, setIsGenerating,
    fontSize, setFontSize,
    toastMessage, showToast,
    aiMessage, aiData, initialTransposition, savedTransposition, isToneSaved: savedTransposition !== null && savedTransposition === transposition, salvarTomPreferido
  };
}