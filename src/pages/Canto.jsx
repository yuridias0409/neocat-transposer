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
    
    // 1. Calcular diferença entre áudio e cifra original para sincronizar
    const diff = canto.tom_audio ? getNoteIndex(canto.tom_audio) - getNoteIndex(canto.tom_original) : 0;
    
    // Normalizar a diferença para ficar entre -6 e 6 (para evitar pulos gigantes)
    let syncOffset = diff;
    if (syncOffset > 6) syncOffset -= 12;
    if (syncOffset < -6) syncOffset += 12;
    
    setTransposition(syncOffset); // Inicia já transposto para sincronizar com o áudio!

    // 2. Carregar perfil do usuário e notas
    const savedProfile = localStorage.getItem('userVoiceProfile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
    if (user) {
      const savedNotes = localStorage.getItem(`salmistasNotes_${user}_${id}`);
      if (savedNotes) setNotes(savedNotes);
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
      const diff = canto.tom_audio ? getNoteIndex(canto.tom_audio) - getNoteIndex(canto.tom_original) : 0;
      let syncOffset = diff;
      if (syncOffset > 6) syncOffset -= 12;
      if (syncOffset < -6) syncOffset += 12;
      
      const audioPitchShift = transposition - syncOffset;
      pitchShiftRef.current.pitch = audioPitchShift;
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
    const cautela = userProfile.learningCautela || 0;
    const userMaxFreq = userProfile.max.freq;
    const songMaxFreq = Math.max(...canto.linhas.map(l => l.freq_max || 0));
    
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
    const songMaxFreq = Math.max(...canto.linhas.map(l => l.freq_max || 0));
    if (songMaxFreq === 0) return null;

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
        <div className="canto-title-block">
          <h1>{canto.titulo}</h1>
          <div className="canto-meta-info">
            <span className="badge badge-primary">Tom Original: {canto.tom_original}</span>
          </div>
        </div>
        
        <div className="canto-controls card">
            <div>
              <div className="control-group">
                <span className="control-label">Transposição Visual</span>
                <div className="transposition-controls">
                  <button className="btn-circle" onClick={() => setTransposition(t => t - 1)}>-</button>
                  <span className="transposition-value" style={{fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)'}}>{tomAtualVisual}</span>
                  <button className="btn-circle" onClick={() => setTransposition(t => t + 1)}>+</button>
                </div>
                <small className="text-center" style={{display: 'block', color: '#666', marginTop: '0.5rem'}}>{transposition > 0 ? `+${transposition}` : transposition} semitons</small>
              </div>
              <button className="btn btn-secondary btn-sm auto-adjust-btn mt-2 w-100" onClick={calcularAjusteMagico}>
                <Settings2 size={16} /> Meu Tom Ideal
              </button>
            </div>
        </div>
      </div>
        
      {(!canto.linhas || canto.linhas.length === 0) && canto.acordes_usados && canto.acordes_usados.length > 0 && transposition !== 0 && (
          <div className="card mb-4" style={{backgroundColor: '#f0f9ff', border: '1px solid #bae6fd'}}>
            <div style={{color: '#0369a1', marginBottom: '0.5rem'}}>
              <strong><SlidersHorizontal size={18} style={{marginRight: '0.5rem', verticalAlign: 'text-bottom'}} /> Guia de Acordes Transpostos</strong>
              <p style={{margin: '0.2rem 0', fontSize: '0.9rem'}}>A cifra acima da imagem não muda, mas você pode usar este guia para tocar os acordes no novo tom:</p>
            </div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontFamily: 'monospace', fontSize: '1.2rem'}}>
              {canto.acordes_usados.map((c, i) => (
                <div key={i} style={{background: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e0f2fe', textAlign: 'center'}}>
                  <div style={{color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'line-through'}}>{c}</div>
                  <div style={{color: '#b91c1c', fontWeight: 'bold'}}>{transposeChordString(c, transposition)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      {(canto.linhas && canto.linhas.length > 0) && renderAssemblyStatus()}

      {showFeedback && !feedbackSent && (
        <div className="feedback-banner card mb-4">
          <p><strong>Esse tom ficou bom para você?</strong></p>
          <div className="feedback-buttons">
            <button className="btn btn-outline success-btn" onClick={() => handleFeedback(true)}>
              <ThumbsUp size={16} /> Sim, ficou ótimo
            </button>
            <button className="btn btn-outline danger-btn" onClick={() => handleFeedback(false)}>
              <ThumbsDown size={16} /> Não, ficou alto demais
            </button>
          </div>
        </div>
      )}

      {canto.audio_url && (
        <div className="audio-player card mb-4">
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
            <button className="btn btn-outline btn-sm" onClick={analisarComIALocal} title="Analisar BPM e Tom com IA">
              ✨ IA
            </button>
            <button className="btn btn-outline btn-sm">
              <SlidersHorizontal size={14} /> Áudio Shiftado
            </button>
          </div>
        </div>
      )}

      {user && (
        <div className="notepad-section mb-4">
          <div className="card" style={{backgroundColor: '#fffdf5', border: '1px solid #e0d8b0'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#8a7a3b'}}>
              <Book size={18} /> <strong>Anotações do Salmista</strong>
            </div>
            <textarea 
              value={notes}
              onChange={handleNotesChange}
              placeholder="Escreva dicas, ritmos ou lembretes sobre este canto..."
              style={{width: '100%', minHeight: '80px', border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', resize: 'vertical'}}
            />
          </div>
        </div>
      )}

      <div className="cifra-container card" style={{position: 'relative', paddingTop: '3rem'}}>
        <div style={{position: 'absolute', top: '0.5rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
           <span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginRight: '0.2rem'}}>FONTE</span>
           <button style={{border: 'none', background: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', color: '#333', fontWeight: 'bold'}} onClick={() => setFontSize(f => Math.max(0.6, f - 0.1))}>-</button>
           <span style={{fontSize: '0.8rem', fontWeight: 'bold', minWidth: '36px', textAlign: 'center'}}>{Math.round(fontSize * 100)}%</span>
           <button style={{border: 'none', background: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', color: '#333', fontWeight: 'bold'}} onClick={() => setFontSize(f => Math.min(2.5, f + 0.1))}>+</button>
        </div>
        
        {canto.linhas && canto.linhas.length > 0 ? (
          <div className="cifra-sheet" style={{fontSize: `${fontSize}rem`}}>
            {canto.linhas.map((linha, index) => {
              const isGargalo = checkGargalo(linha);
              return (
                <div key={linha.id || index} className={`cifra-line ${isGargalo ? 'line-alert' : ''}`}>
                  {isGargalo && (
                    <div className="alert-tooltip">
                      <AlertTriangle size={14} /> Fora de Alcance
                    </div>
                  )}
                  <div className="cifra-content">
                    {renderCifraComCordasETransposicao(linha.cifra || linha.texto)}
                  </div>
                </div>
              );
            })}
            
            {/* Mostrar imagens caso a cifra esteja incompleta (menos de 5 linhas) ou sempre disponível no final */}
            {canto.imagens_originais && canto.imagens_originais.length > 0 && (
              <div className="original-images-fallback" style={{marginTop: '3rem', paddingTop: '2rem', borderTop: '1px dashed #ccc', textAlign: 'center'}}>
                <div className="alert mb-4" style={{backgroundColor: '#f8fafc', color: '#64748b', textAlign: 'left', padding: '0.75rem'}}>
                  <strong><Book size={16} style={{verticalAlign: 'text-bottom', marginRight: '0.25rem'}} /> Ficha original</strong>
                </div>
                {canto.imagens_originais.map((imgUrl, i) => (
                  <img 
                    key={i} 
                    src={imgUrl} 
                    alt={`Página ${i+1}`} 
                    referrerPolicy="no-referrer"
                    style={{maxWidth: '100%', height: 'auto', marginBottom: '1rem', border: '1px solid #eee', borderRadius: '8px'}} 
                  />
                ))}
              </div>
            )}
            
          </div>
        ) : (
          <div className="cifra-imagens-sheet text-center">
            {canto.imagens_originais && canto.imagens_originais.map((imgUrl, i) => (
              <img 
                key={i} 
                src={imgUrl} 
                alt={`Página ${i+1}`} 
                referrerPolicy="no-referrer"
                style={{maxWidth: '100%', height: 'auto', marginBottom: '1rem', border: '1px solid #eee', borderRadius: '8px'}} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canto;
