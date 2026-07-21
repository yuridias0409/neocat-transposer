import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Settings2, SlidersHorizontal, AlertTriangle, Users, User, ThumbsUp, ThumbsDown, Book } from 'lucide-react';
import * as Tone from 'tone';
import { cantosData } from '../data';
import { transposeChordString, getNoteIndex } from '../utils';
import './Canto.css';

const Canto = ({ user }) => {
  const { id } = useParams();
  const canto = cantosData[id];
  
  const [transposition, setTransposition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  
  // Notas Pessoais
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  
  // Guia de Acordes
  const [showChordGuide, setShowChordGuide] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontSize, setFontSize] = useState(1.1);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };
  
  const playerRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canto) return;
    
    // 1. Iniciar sempre no tom original (transposition = 0) pois o áudio já está no tom_original
    setTransposition(0);

    // 2. Carregar perfil do usuário e notas
    const savedProfile = localStorage.getItem('userVoiceProfile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
    if (user) {
      const savedNotes = localStorage.getItem(`salmistasNotes_${user}_${id}`);
      if (savedNotes) {
        setNotes(savedNotes);
        setShowNotes(true);
      }
    }

    // 3. Setup Audio
    if (canto.audio_url) {
      pitchShiftRef.current = new Tone.PitchShift({
        pitch: 0, // pitchShift is relative to the audio file. We start at 0 (playing the file as is).
        windowSize: 0.1,
        delayTime: 0,
        feedback: 0
      }).toDestination();

      playerRef.current = new Tone.Player({
        url: encodeURI(canto.audio_url),
        onload: () => {
          setIsAudioLoaded(true);
          setDuration(playerRef.current.buffer.duration);
        },
        loop: false
      }).connect(pitchShiftRef.current);
    }

    return () => {
      if (playerRef.current) playerRef.current.dispose();
      if (pitchShiftRef.current) pitchShiftRef.current.dispose();
    };
  }, [canto, id, user]);

  useEffect(() => {
    // Quando 'transposition' muda (via botões ou ajuste mágico), nós precisamos ajustar o PITCH do áudio
    // Mas atenção: o `transposition` na tela é relativo à *cifra escrita* (tom_original).
    // O áudio já tem seu próprio tom.
    // Ex: Cifra em Em (0). Áudio em Dm (-2). Transposition inicia em -2 para bater com o áudio (PitchShift do áudio = 0).
    // Se o user clica +1, Transposition vira -1 (Ebm). O PitchShift do áudio deve ser +1.
    // Fórmula: Shift do Áudio = Transposition Desejada - Offset Inicial de Sincronia
    if (pitchShiftRef.current && canto) {
      let audioPitchShift = transposition;
      
      // Normaliza o shift do áudio para ficar sempre no intervalo de -6 a +5 semitons, evitando shifts de oitavas que distorcem o som
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
            setProgress((elapsed / dur) * 100);
            setCurrentTime(elapsed);
          }
          animationRef.current = requestAnimationFrame(updateProgress);
        } else if (playerRef.current) {
          if (Tone.now() - startTimeRef.current > playerRef.current.buffer.duration) {
              setIsPlaying(false);
          } else {
              animationRef.current = requestAnimationFrame(updateProgress);
          }
        }
      };
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleSeek = (e) => {
    if (!isAudioLoaded || !playerRef.current || !playerRef.current.buffer) return;
    
    const bounds = e.currentTarget.getBoundingClientRect();
    const clickPos = e.clientX - bounds.left;
    const percentage = Math.max(0, Math.min(1, clickPos / bounds.width));
    const dur = playerRef.current.buffer.duration;
    const newTime = percentage * dur;
    
    if (isPlaying) {
      cancelAnimationFrame(animationRef.current);
      
      // Atualiza visualmente imediatamente para não ter delay
      setProgress(percentage * 100);
      setCurrentTime(newTime);
      
      playerRef.current.stop();
      playerRef.current.start(Tone.now(), newTime);
      startTimeRef.current = Tone.now() - newTime;
      
      const updateProgress = () => {
        if (playerRef.current && playerRef.current.state === "started") {
          const elapsed = Tone.now() - startTimeRef.current;
          const duration_val = playerRef.current.buffer.duration;
          if (duration_val > 0) {
            if (elapsed >= duration_val) {
              setIsPlaying(false);
              setProgress(0);
              setCurrentTime(0);
              offsetRef.current = 0;
              playerRef.current.stop();
              return;
            }
            setProgress((elapsed / duration_val) * 100);
            setCurrentTime(elapsed);
          }
          animationRef.current = requestAnimationFrame(updateProgress);
        } else if (playerRef.current) {
          // Em vez de matar o loop se o estado oscilar rápido, 
          // apenas verifica se a música realmente parou
          if (Tone.now() - startTimeRef.current > playerRef.current.buffer.duration) {
              setIsPlaying(false);
          } else {
              animationRef.current = requestAnimationFrame(updateProgress);
          }
        }
      };
      animationRef.current = requestAnimationFrame(updateProgress);
      
    } else {
      offsetRef.current = newTime;
      setProgress(percentage * 100);
      setCurrentTime(newTime);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const calcularAjusteMagico = () => {
    if (!userProfile) {
      showToast("Calibre sua voz primeiro!");
      return;
    }
    
    const hasMelodicData = canto.freq_max_curada > 0 || canto.freq_max_global > 0 || (canto.linhas && canto.linhas.length > 0 && canto.linhas.some(l => l.freq_max > 0));

    if (!hasMelodicData) {
      showToast("Este canto ainda não possui análise melódica para o cálculo automático do tom ideal.");
      return;
    }

    const cautela = userProfile.learningCautela || 0;
    const userMaxFreq = userProfile.max.freq;
    const songMaxFreq = canto.freq_max_curada || canto.freq_max_global || Math.max(...canto.linhas.map(l => l.freq_max || 0));
    
    let novoTom = 0;
    if (songMaxFreq > userMaxFreq) {
      novoTom = Math.round(12 * Math.log2(userMaxFreq / songMaxFreq)) - cautela;
    } else {
      novoTom = -cautela;
    }

    if (transposition === novoTom) {
      showToast("🎵 Já está no seu tom ideal!");
    } else {
      setTransposition(novoTom);
    }
  };

  const handleFeedback = (funcionou) => {
    if (!userProfile) return;
    if (!funcionou) {
      const updatedProfile = { ...userProfile, learningCautela: (userProfile.learningCautela || 0) + 1 };
      localStorage.setItem('userVoiceProfile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      showToast("Aprendizado Registrado! Sugestões futuras serão mais graves.");
    } else {
      showToast("Ótimo! O sistema manterá essa calibração.");
    }
    setFeedbackSent(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  const gerarCifraComIA = async () => {
    if (!canto.imagens_originais || canto.imagens_originais.length === 0) {
      showToast("Este canto não tem imagens para analisar.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:8000/generate-cifra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id_canto: id, images: canto.imagens_originais })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erro na IA Local.");
      }
      
      const data = await res.json();
      showToast("✨ Cifra inteligente gerada com sucesso! A página será atualizada.");
      window.location.reload(); // Recarrega para obter as novas linhas do data.js
      
    } catch (err) {
      console.error(err);
      showToast(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const analisarComIALocal = async () => {
    if (!canto.audio_url) {
      showToast("Este canto não tem áudio para analisar.");
      return;
    }
    
    // Simulate loading state if needed here
    try {
      const res = await fetch("http://localhost:8000/analyze-song", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ audio_path: canto.audio_url })
      });
      
      if (!res.ok) {
        throw new Error("Erro na IA Local. O servidor Python está rodando?");
      }
      
      const data = await res.json();
      
      let msg = `✨ IA Acústica Detectou!\n\nTom da Gravação: ${data.key}\nBPM: ${data.bpm}`;
      
      // Update transposition based on AI findings!
      if (canto.tom_original) {
        const diff = getNoteIndex(data.key) - getNoteIndex(canto.tom_original);
        let syncOffset = diff;
        if (syncOffset > 6) syncOffset -= 12;
        if (syncOffset < -6) syncOffset += 12;
        
        if (syncOffset > 0) {
            msg += `\n(Equivale a Capo na casa ${syncOffset})`;
        }
      }
      showToast(msg);
      
    } catch (err) {
      console.error(err);
      showToast(err.message);
    }
  };

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    if (user) {
      localStorage.setItem(`salmistasNotes_${user}_${id}`, val);
    }
  };

  if (!canto) return <div className="container mt-4">Canto não encontrado.</div>;

  const renderCifraComCordasETransposicao = (cifraStr) => {
    const parts = cifraStr.split(/(\[[^\]]+\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const chordOriginal = part.slice(1, -1);
        const chordTransposed = transposeChordString(chordOriginal, transposition);
        return <span key={idx} className="cifra-chord">{chordTransposed}</span>;
      }
      return <span key={idx} className="cifra-text">{part}</span>;
    });
  };

  const checkGargalo = (linha) => {
    if (!linha.freq_max) return false;
    if (!userProfile) return linha.pico_agudo;
    const freqAtual = linha.freq_max * Math.pow(2, transposition / 12);
    return freqAtual > userProfile.max.freq;
  };

  // Determinar o tom atual visual para mostrar no cabeçalho
  const tomAtualVisual = transposeChordString(canto.tom_original, transposition);

  // LÓGICA: PEOPLE-COMPATIBLE TRANSPOSITION (Neo-Transposer)
  const renderAssemblyStatus = () => {
    // Para a assembleia, usamos primeiramente a nota máxima dedicada ao povo (curada por humanos)
    const songMaxFreq = canto.freq_max_povo_curada || canto.freq_max_curada || canto.freq_max_global || Math.max(...(canto.linhas || []).map(l => l.freq_max || 0));
    if (!songMaxFreq || songMaxFreq === -Infinity) return null;

    const currentMaxFreq = songMaxFreq * Math.pow(2, transposition / 12);
    const assemblyMaxLimit = 246.94; // B3
    const assemblyMinMaxLimit = 164.81; // E3

    const idealAssemblyTransposition = Math.floor(12 * Math.log2(assemblyMaxLimit / songMaxFreq));
    const idealChord = transposeChordString(canto.tom_original, idealAssemblyTransposition);
    
    // Detecta equivalência com capo
    const isEquivalentViaCapo = (sugeridoTransp) => {
      const diff = transposition - sugeridoTransp;
      if (diff > 0 && diff <= 11) {
        return { capo: diff, eq: true };
      }
      return false;
    };
    
    const capoEquiv = isEquivalentViaCapo(idealAssemblyTransposition);
    
    // Se a sugestão alternativa é equivalente ao tom atual por causa do uso do capo, nem exibe alerta
    if (capoEquiv) return null;

    // Se o tom atual de fato coincide com o tom ideal sugerido
    if (transposition === idealAssemblyTransposition) {
      return (
        <div className="alert alert-success mb-4" style={{backgroundColor: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
          <strong><Users size={18} style={{marginRight: '0.5rem', verticalAlign: 'text-bottom'}} /> Cenário Perfeito:</strong> 
          <p style={{margin: '0.5rem 0 0 0'}}>Este tom ({tomAtualVisual}) é o ideal para a assembleia também cantar o refrão confortavelmente!</p>
        </div>
      );
    }

    if (currentMaxFreq > assemblyMaxLimit) {
      return (
        <div className="alert alert-warning mb-4" style={{backgroundColor: '#fef9c3', color: '#854d0e', padding: '1rem', borderRadius: '8px', border: '1px solid #fef08a'}}>
          <strong><AlertTriangle size={18} style={{marginRight: '0.5rem', verticalAlign: 'text-bottom'}} /> Alto para o povo:</strong> 
          <p style={{margin: '0.5rem 0 0 0'}}>Estes acordes ({tomAtualVisual}) são bons para a sua voz, mas provavelmente altos demais para a assembleia.</p>
          <hr style={{borderColor: '#fde047', margin: '0.5rem 0'}} />
          <p style={{margin: 0}}><strong>Sugestão (Alternativa):</strong> Transponha para <strong>{idealChord}</strong> ({idealAssemblyTransposition > 0 ? `+${idealAssemblyTransposition}` : idealAssemblyTransposition}). Será mais grave, mas o povo alcançará.</p>
        </div>
      );
    } else if (currentMaxFreq < assemblyMinMaxLimit) {
      return (
        <div className="alert alert-info mb-4" style={{backgroundColor: '#e0f2fe', color: '#075985', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd'}}>
          <strong><Users size={18} style={{marginRight: '0.5rem', verticalAlign: 'text-bottom'}} /> Muito grave para o povo:</strong> 
          <p style={{margin: '0.5rem 0 0 0'}}>O tom {tomAtualVisual} fará a assembleia cantar num registro muito baixo.</p>
          <hr style={{borderColor: '#7dd3fc', margin: '0.5rem 0'}} />
          <p style={{margin: 0}}><strong>Sugestão (Alternativa):</strong> Suba a transposição para <strong>{idealChord}</strong> ({idealAssemblyTransposition > 0 ? `+${idealAssemblyTransposition}` : idealAssemblyTransposition}).</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container canto-page" style={{position: 'relative'}}>
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#333', color: 'white', padding: '1rem 2rem', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, whiteSpace: 'pre-line',
          textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '1rem'
        }}>
          {toastMessage}
        </div>
      )}
      <div className="canto-header mb-4">
        <div className="canto-title-block" style={{ width: '100%' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>{canto.titulo}</h1>
          <div className="canto-meta-info">
            <span className="badge badge-primary">Tom Original: {canto.tom_original}</span>
          </div>
        </div>
      </div>
        

      {renderAssemblyStatus()}


      {canto.audio_url && (
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
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="card text-center" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#555', marginBottom: '1rem', fontWeight: 'bold' }}>
                Áudio Original ({canto.tom_audio || '?'})
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', height: '40px' }}>
                <div style={{ width: '4px', height: '16px', background: '#d4af37', borderRadius: '2px' }}></div>
                <div style={{ width: '4px', height: '28px', background: '#d4af37', borderRadius: '2px' }}></div>
                <div style={{ width: '4px', height: '12px', background: '#d4af37', borderRadius: '2px' }}></div>
                <div style={{ width: '4px', height: '40px', background: '#d4af37', borderRadius: '2px' }}></div>
                <div style={{ width: '4px', height: '24px', background: '#d4af37', borderRadius: '2px' }}></div>
              </div>
            </div>
            
            <div className="card text-center" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#555', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                Transposição
              </div>
              
              <div className="transposition-controls" style={{ background: '#fdfbf7', padding: '0.5rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                 <button className="btn-circle btn-sm" onClick={() => setTransposition(t => t - 1)} style={{ width: '30px', height: '30px', minWidth: '30px' }}>-</button>
                 <span className="transposition-value" style={{fontWeight: 'bold', fontSize: '1.5rem', color: '#851d1d', margin: '0 1.5rem', minWidth: '45px'}}>{tomAtualVisual}</span>
                 <button className="btn-circle btn-sm" onClick={() => setTransposition(t => t + 1)} style={{ width: '30px', height: '30px', minWidth: '30px' }}>+</button>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
                {transposition === 0 ? '0' : (transposition > 0 ? `+${transposition}` : transposition)} semitons
              </div>
              
              <button className="btn btn-secondary btn-sm auto-adjust-btn w-100" onClick={calcularAjusteMagico} style={{ maxWidth: '200px' }}>
                 <Settings2 size={14} style={{ marginRight: '0.4rem' }}/> Meu Tom Ideal
              </button>

              {(!canto.linhas || canto.linhas.length === 0) && canto.acordes_usados && canto.acordes_usados.length > 0 && transposition !== 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#555' }}>
                  <input type="checkbox" id="chordGuideToggle" checked={showChordGuide} onChange={(e) => setShowChordGuide(e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0369a1' }} />
                  <label htmlFor="chordGuideToggle" style={{ cursor: 'pointer', margin: 0 }}>Mostrar Guia de Acordes</label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFeedback && !feedbackSent && (
        <div className="feedback-banner card mb-4" style={{border: '1px solid #e0d8b0', backgroundColor: '#fffcf2'}}>
          <p style={{marginBottom: '1rem', color: '#8a7a3b'}}><strong>Esse tom sugerido ficou bom para você cantar?</strong></p>
          <div className="feedback-buttons" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <button className="btn btn-outline success-btn flex-1" onClick={() => handleFeedback(true)} style={{flex: 1, minWidth: '150px'}}>
              <ThumbsUp size={16} /> Sim, ficou ótimo
            </button>
            <button className="btn btn-outline danger-btn flex-1" onClick={() => handleFeedback(false)} style={{flex: 1, minWidth: '150px'}}>
              <ThumbsDown size={16} /> Não, ficou alto demais
            </button>
          </div>
        </div>
      )}

      {user && (
        <div className="notepad-section mb-4">
          <div className="card" style={{backgroundColor: '#fffdf5', border: '1px solid #e0d8b0', transition: 'all 0.3s ease'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#8a7a3b', cursor: 'pointer'}} onClick={() => setShowNotes(!showNotes)}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Book size={18} /> <strong>Anotações do Salmista</strong>
              </div>
              <div style={{ position: 'relative', width: '36px', height: '20px', backgroundColor: showNotes ? '#a13333' : '#cbd5e1', borderRadius: '20px', transition: '0.3s', display: 'flex', alignItems: 'center', padding: '2px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s', transform: showNotes ? 'translateX(16px)' : 'translateX(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
            {showNotes && (
              <textarea 
                value={notes}
                onChange={handleNotesChange}
                placeholder="Escreva dicas, ritmos ou lembretes sobre este canto..."
                style={{width: '100%', minHeight: '80px', border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', resize: 'vertical', marginTop: '1rem', borderTop: '1px dashed #e0d8b0', paddingTop: '1rem'}}
              />
            )}
          </div>
        </div>
      )}

      <div className="cifra-container card text-center" style={{position: 'relative', paddingTop: '2rem'}}>        <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left' }}>
          
          <div style={{ flex: '3 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {canto.imagens_originais && canto.imagens_originais.length > 0 ? (
              <div className="cifra-imagens-sheet text-center" style={{ width: '100%' }}>
            {canto.imagens_originais.map((imgUrl, i) => (
              <img 
                key={i} 
                src={imgUrl} 
                alt={`Ficha ${i+1}`} 
                referrerPolicy="no-referrer"
                style={{maxWidth: '100%', height: 'auto', marginBottom: '1rem', border: '1px solid #eee', borderRadius: '8px'}} 
              />
            ))}
          </div>
        ) : (
          <div className="p-4" style={{color: '#666'}}>
            Nenhuma cifra em texto ou imagem encontrada para este canto.
          </div>
        )}
      </div>

      {(showChordGuide) && (!canto.linhas || canto.linhas.length === 0) && canto.acordes_usados && canto.acordes_usados.length > 0 && transposition !== 0 && (
        <div className="guia-acordes-sidebar" style={{ flex: '1 1 300px', maxWidth: '450px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1rem', alignSelf: 'flex-start' }}>
          <div style={{color: '#0369a1', marginBottom: '0.75rem'}}>
            <strong><SlidersHorizontal size={18} style={{marginRight: '0.5rem', verticalAlign: 'text-bottom'}} /> Guia de Acordes</strong>
            <p style={{margin: '0.25rem 0 0 0', fontSize: '0.8rem'}}>A imagem não muda, use este guia para tocar no novo tom:</p>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontFamily: 'monospace', fontSize: '1.1rem'}}>
            {canto.acordes_usados.map((c, i) => (
              <div key={i} style={{background: '#fff', padding: '0.3rem 0.5rem', borderRadius: '8px', border: '1px solid #e0f2fe', textAlign: 'center', flex: '1 1 auto', minWidth: '60px'}}>
                <div style={{color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'line-through'}}>{c}</div>
                <div style={{color: '#b91c1c', fontWeight: 'bold'}}>{transposeChordString(c, transposition)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  </div>
</div>
  );
};

export default Canto;
