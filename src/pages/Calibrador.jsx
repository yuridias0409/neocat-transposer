import React, { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle, ArrowRight, Guitar, ThumbsUp, ThumbsDown, User, Play, Square, UserPlus } from 'lucide-react';
import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';
import './Calibrador.css';

const freqToNote = (freq) => {
  if (!freq || freq < 20) return null;
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  let c0 = a4 * Math.pow(2, -4.75);
  let h = Math.round(12 * Math.log2(freq / c0));
  let octave = Math.floor(h / 12);
  let n = h % 12;
  return { note: notes[n], octave: octave, name: `${notes[n]}${octave}`, freq };
};

const baseFreqs = { 'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00, 'C4': 261.63, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00 };

const Calibrador = () => {
  const [mode, setMode] = useState(null); // 'mic', 'empirical', 'assistant'
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  
  const [minNote, setMinNote] = useState(null);
  const [maxNote, setMaxNote] = useState(null);

  const [empCapo, setEmpCapo] = useState(0);

  // Assistant State
  const [assistantGender, setAssistantGender] = useState(null);
  const [assistantRange, setAssistantRange] = useState(null);
  const [astOffsetGrave, setAstOffsetGrave] = useState(0);
  const [astOffsetAgudo, setAstOffsetAgudo] = useState(0);
  const [astPlaying, setAstPlaying] = useState(false);
  const [showFeedbackAst, setShowFeedbackAst] = useState(false);

  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const astPlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopRecording();
      stopAstAudio();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new window.AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      detectorRef.current = PitchDetector.forFloat32Array(analyzerRef.current.fftSize);
      setIsRecording(true);
      updatePitch();
    } catch (err) {
      alert("Precisamos de acesso ao microfone!");
    }
  };

  const stopRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setCurrentNote(null);
  };

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  const updatePitch = () => {
    if (!analyzerRef.current || !detectorRef.current || !audioContextRef.current) return;
    const input = new Float32Array(detectorRef.current.inputLength);
    analyzerRef.current.getFloatTimeDomainData(input);
    const [pitch, clarity] = detectorRef.current.findPitch(input, audioContextRef.current.sampleRate);
    if (clarity > 0.8 && pitch > 50 && pitch < 1000) {
      const noteData = freqToNote(pitch);
      setCurrentNote(noteData);
      if (step === 2) setMinNote(prev => (!prev || pitch < prev.freq) ? noteData : prev);
      if (step === 3) setMaxNote(prev => (!prev || pitch > prev.freq) ? noteData : prev);
    }
    rafRef.current = requestAnimationFrame(updatePitch);
  };

  const handleNext = () => {
    if (isRecording) stopRecording();
    if (step < 4) {
      if (step === 3 && minNote && maxNote) {
        localStorage.setItem('userVoiceProfile', JSON.stringify({ min: minNote, max: maxNote, learningCautela: 0 }));
      }
      setStep(step + 1);
    }
  };

  const handleEmpiricalGrave = (conseguiu) => {
    if (!conseguiu) {
      setEmpCapo(c => c + 1); 
    } else {
      setMinNote({ name: 'E2 (Aprox)', freq: baseFreqs['E2'] * Math.pow(2, empCapo/12) });
      setStep(3);
      setEmpCapo(0); 
    }
  };

  const handleEmpiricalAgudo = (conseguiu) => {
    if (!conseguiu) {
      setEmpCapo(c => c - 1); 
    } else {
      setMaxNote({ name: 'G4 (Aprox)', freq: baseFreqs['G4'] * Math.pow(2, empCapo/12) });
      localStorage.setItem('userVoiceProfile', JSON.stringify({ 
        min: minNote || { name: 'E2', freq: 82 }, 
        max: { name: 'G4', freq: baseFreqs['G4'] * Math.pow(2, empCapo/12) },
        learningCautela: 0
      }));
      setStep(4);
    }
  };

  // --- Assistant Logic ---
  const stopAstAudio = () => {
    if (astPlayerRef.current) {
      astPlayerRef.current.stop();
      astPlayerRef.current.dispose();
      astPlayerRef.current = null;
    }
    setAstPlaying(false);
  };

  const playAstAudio = async (songId, offset) => {
    stopAstAudio();
    await Tone.start();
    const url = `/calibrador/${songId}_${offset}.mp3`;
    astPlayerRef.current = new Tone.Player({
      url: url,
      autostart: true,
      onload: () => {
        setAstPlaying(true);
      },
      onstop: () => {
        setAstPlaying(false);
      }
    }).toDestination();
  };

  const toggleAstAudio = (songId, offset) => {
    if (astPlaying) {
      stopAstAudio();
    } else {
      playAstAudio(songId, offset);
    }
  };

  const handleAstGender = (gender) => {
    setAssistantGender(gender);
    setStep(1.5);
  };

  const handleAstRange = (rangeType) => {
    setAssistantRange(rangeType);
    if (assistantGender === 'male') {
       if (rangeType === 'high') { setAstOffsetGrave(-1); setAstOffsetAgudo(3); }
       if (rangeType === 'normal') { setAstOffsetGrave(-3); setAstOffsetAgudo(0); }
       if (rangeType === 'low') { setAstOffsetGrave(-5); setAstOffsetAgudo(-2); }
    } else {
       if (rangeType === 'high') { setAstOffsetGrave(2); setAstOffsetAgudo(8); }
       if (rangeType === 'normal') { setAstOffsetGrave(0); setAstOffsetAgudo(5); }
       if (rangeType === 'low') { setAstOffsetGrave(-2); setAstOffsetAgudo(3); }
    }
    setStep(2);
  };

  const astGraveSim = () => {
    setShowFeedbackAst(true);
    setTimeout(() => {
      setShowFeedbackAst(false);
      if (astOffsetGrave > -10) {
         setAstOffsetGrave(prev => prev - 1);
         stopAstAudio();
         playAstAudio('769', astOffsetGrave - 1); // Auto play next
      } else {
         stopAstAudio();
         setStep(3); 
      }
    }, 800);
  };

  const astGraveNao = () => {
    stopAstAudio();
    setStep(3);
  };

  const astAgudoSim = () => {
    setShowFeedbackAst(true);
    setTimeout(() => {
      setShowFeedbackAst(false);
      if (astOffsetAgudo < 8) {
         setAstOffsetAgudo(prev => prev + 1);
         stopAstAudio();
         playAstAudio('824', astOffsetAgudo + 1); // Auto play next
      } else {
         stopAstAudio();
         astFinish();
      }
    }, 800);
  };

  const astAgudoNao = () => {
    stopAstAudio();
    astFinish();
  };

  const astFinish = () => {
     const minF = 82.41 * Math.pow(2, astOffsetGrave / 12);
     const maxF = 392.00 * Math.pow(2, astOffsetAgudo / 12);
     localStorage.setItem('userVoiceProfile', JSON.stringify({
        min: { name: 'Auto', freq: minF },
        max: { name: 'Auto', freq: maxF },
        learningCautela: 0
     }));
     setStep(4);
  };

  const getVoiceType = (minFreq, maxFreq) => {
    if (!minFreq || !maxFreq) return "Desconhecido";
    if (minFreq < 100) return "Baixo / Barítono"; 
    if (minFreq >= 100 && minFreq < 150) return "Tenor / Contralto"; 
    if (minFreq >= 150) return "Soprano / Mezzo"; 
    return "Desconhecido";
  };

  if (!mode) {
    return (
      <div className="container calibrador-page">
        <div className="calibrador-card card text-center">
          <h2>Como você prefere calibrar sua voz?</h2>
          <div className="mode-selection mt-4" style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            
            <button className="btn btn-outline" style={{flexDirection: 'column', padding: '2rem', flex: '1 1 200px'}} onClick={() => setMode('assistant')}>
              <UserPlus size={48} className="mb-2" style={{color: '#b91c1c'}} />
              <strong>Salmista Assistente</strong>
              <small style={{display: 'block', marginTop: '0.5rem', color: '#666'}}>Guiado por áudio (Recomendado)</small>
            </button>

            <button className="btn btn-outline" style={{flexDirection: 'column', padding: '2rem', flex: '1 1 200px'}} onClick={() => setMode('mic')}>
              <Mic size={48} className="mb-2 text-primary" />
              <strong>Automático (Microfone)</strong>
              <small style={{display: 'block', marginTop: '0.5rem', color: '#666'}}>Cante e eu descubro</small>
            </button>

            <button className="btn btn-outline" style={{flexDirection: 'column', padding: '2rem', flex: '1 1 200px'}} onClick={() => setMode('empirical')}>
              <Guitar size={48} className="mb-2 text-primary" />
              <strong>Prático (Com Violão)</strong>
              <small style={{display: 'block', marginTop: '0.5rem', color: '#666'}}>Toque os acordes e teste</small>
            </button>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container calibrador-page">
      <div className="calibrador-card card">
        {mode !== 'assistant' && (
          <div className="steps-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 4 ? 'active' : ''}`}></div>
          </div>
        )}

        <div className="calibrador-content">
          
          {/* --- ASSISTANT MODE VIEWS --- */}
          {mode === 'assistant' && step === 1 && (
            <div className="step-pane text-center">
              <h2>Assistente de medição de voz</h2>
              <p className="mb-4">Para começar, escolha uma dessas opções:</p>
              <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                <button className="btn btn-outline" style={{padding: '2rem', flexDirection: 'column'}} onClick={() => handleAstGender('male')}>
                   <span style={{color: '#b91c1c'}}>Tenho voz de</span>
                   <h3 style={{margin: 0, color: '#b91c1c', marginTop: '0.5rem'}}>HOMEM</h3>
                </button>
                <button className="btn btn-outline" style={{padding: '2rem', flexDirection: 'column'}} onClick={() => handleAstGender('female')}>
                   <span style={{color: '#b91c1c'}}>Tenho voz de</span>
                   <h3 style={{margin: 0, color: '#b91c1c', marginTop: '0.5rem'}}>MULHER</h3>
                </button>
              </div>
            </div>
          )}

          {mode === 'assistant' && step === 1.5 && (
            <div className="step-pane text-center">
              <h2>Assistente de medição de voz</h2>
              <p className="mb-4">Escolha a opção que melhor te descreve:</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto'}}>
                <button className="btn btn-outline" style={{justifyContent: 'flex-start', textAlign: 'left'}} onClick={() => handleAstRange('normal')}>
                   <span style={{color: '#b91c1c'}}>Nem mais aguda nem mais grave que a maioria / Não sei →</span>
                </button>
                <button className="btn btn-outline" style={{justifyContent: 'flex-start', textAlign: 'left'}} onClick={() => handleAstRange('high')}>
                   <span style={{color: '#b91c1c'}}>Minha voz é mais aguda do que a maioria →</span>
                </button>
                <button className="btn btn-outline" style={{justifyContent: 'flex-start', textAlign: 'left'}} onClick={() => handleAstRange('low')}>
                   <span style={{color: '#b91c1c'}}>Minha voz é mais grave do que a maioria →</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'assistant' && step === 2 && (
            <div className="step-pane text-center">
              <h2>Passo 2: vamos encontrar sua nota mais grave</h2>
              <p className="mb-4">Tente cantar a seguinte estrofe, com o áudio de referência. <br/>Lembre-se: você deve cantar com voz grave, mas sem ir muito grave, ou vai ser difícil ser ouvido na comunidade!</p>
              
              <div className="sheet-preview" style={{background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1rem'}}>
                    <strong style={{color: '#b91c1c'}}>Cante assim:</strong>
                    <button className="btn btn-primary" style={{padding: '0.5rem'}} onClick={() => toggleAstAudio('769', astOffsetGrave)}>
                       {astPlaying ? <Square size={18}/> : <Play size={18}/>}
                    </button>
                 </div>
                 <h4 style={{color: '#b91c1c', textAlign: 'center'}}>IAHWEH, TU ÉS MEU DEUS</h4>
                 <div style={{fontFamily: 'monospace', fontSize: '1.1rem', marginTop: '1.5rem', lineHeight: '2'}}>
                    <span style={{color: '#b91c1c'}}>Mi-</span>{'                 '}<span style={{color: '#b91c1c'}}>Si7</span><br/>
                    IAHWEH, TU ÉS MEU DEUS,<br/><br/>
                    {'           '}<span style={{color: '#b91c1c'}}>Mi-</span><br/>
                    EU TE LOUVAREI.
                 </div>
              </div>

              <div className="mt-4">
                 <p style={{fontSize: '1.2rem'}}>Conseguiu cantar?</p>
                 {showFeedbackAst ? (
                    <div style={{color: 'green', fontWeight: 'bold', fontSize: '1.2rem'}}>
                      <CheckCircle size={24} style={{verticalAlign: 'text-bottom', marginRight: '0.5rem'}} /> Excelente! Ajustando...
                    </div>
                 ) : (
                   <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                      <button className="btn btn-outline" style={{borderColor: 'green', color: 'green'}} onClick={astGraveSim}>
                         Sim
                      </button>
                      <button className="btn btn-outline" style={{borderColor: '#b91c1c', color: '#b91c1c'}} onClick={astGraveNao}>
                         Não, é muito grave
                      </button>
                   </div>
                 )}
              </div>
            </div>
          )}

          {mode === 'assistant' && step === 3 && (
            <div className="step-pane text-center">
              <h2>Passo 3: vamos encontrar sua nota mais aguda</h2>
              <p className="mb-4">Tente cantar a seguinte estrofe, com o áudio de referência. <br/>Atenção: cante forte, mas sem gritar!</p>
              
              <div className="sheet-preview" style={{background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1rem'}}>
                    <strong style={{color: '#b91c1c'}}>Cante assim:</strong>
                    <button className="btn btn-primary" style={{padding: '0.5rem'}} onClick={() => toggleAstAudio('824', astOffsetAgudo)}>
                       {astPlaying ? <Square size={18}/> : <Play size={18}/>}
                    </button>
                 </div>
                 <h4 style={{color: '#b91c1c', textAlign: 'center'}}>SE O SENHOR NÃO CONSTRÓI A CASA</h4>
                 <div style={{fontFamily: 'monospace', fontSize: '1.1rem', marginTop: '1.5rem', lineHeight: '2'}}>
                    <span style={{color: '#b91c1c'}}>Do</span>{'                  '}<span style={{color: '#b91c1c'}}>La-</span>{'    '}<span style={{color: '#b91c1c'}}>Fa</span><br/>
                    SE O SENHOR NÃO CONSTRÓI A CASA,<br/><br/>
                    {'   '}<span style={{color: '#b91c1c'}}>Mi</span>{'                      '}<span style={{color: '#b91c1c'}}>La-</span><br/>
                    EM VÃO TRABALHAM OS CONSTRUTORES.
                 </div>
              </div>

              <div className="mt-4">
                 <p style={{fontSize: '1.2rem'}}>Conseguiu cantar?</p>
                 {showFeedbackAst ? (
                    <div style={{color: 'green', fontWeight: 'bold', fontSize: '1.2rem'}}>
                      <CheckCircle size={24} style={{verticalAlign: 'text-bottom', marginRight: '0.5rem'}} /> Muito bom! Ajustando...
                    </div>
                 ) : (
                   <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                      <button className="btn btn-outline" style={{borderColor: 'green', color: 'green'}} onClick={astAgudoSim}>
                         Sim
                      </button>
                      <button className="btn btn-outline" style={{borderColor: '#b91c1c', color: '#b91c1c'}} onClick={astAgudoNao}>
                         Não, é muito agudo
                      </button>
                   </div>
                 )}
              </div>
            </div>
          )}


          {/* --- LEGACY MODES (Mic & Empirical) --- */}
          {step === 1 && mode !== 'assistant' && (
            <div className="step-pane text-center">
              <h2>Bem-vindo ao Calibrador</h2>
              <p className="mb-4">
                Vamos descobrir a sua extensão vocal.
              </p>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Começar <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && mode === 'mic' && (
            <div className="step-pane text-center">
              <h2>Teste do Grave</h2>
              <p className="mb-4">Cante a nota mais <strong>grave</strong> que você consegue emitir com conforto.</p>
              <div className={`mic-button ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
                <Mic size={32} />
              </div>
              <div className="live-note-display mt-3">
                {currentNote ? <h1 style={{color: 'var(--color-primary)', fontSize: '3rem', margin: 0}}>{currentNote.name}</h1> : <h1 style={{color: '#ccc', fontSize: '3rem', margin: 0}}>--</h1>}
                {minNote && <p style={{color: '#666', marginTop: '1rem'}}>Nota Mais Grave Salva: <strong>{minNote.name}</strong></p>}
              </div>
              <button className="btn btn-primary mt-4" onClick={handleNext}>Próximo Passo</button>
            </div>
          )}

          {step === 2 && mode === 'empirical' && (
            <div className="step-pane text-center">
              <h2>Passo 2: Hora do Grave</h2>
              <p className="mb-4">Pegue seu violão. Toque um acorde de <strong>Lá Menor (Am)</strong> {empCapo === 0 ? <strong>sem capotraste</strong> : <span>com o capotraste na <strong>casa {empCapo}</strong></span>} e tente cantar bem grave.</p>
              
              {!isRecording ? (
                <button className="btn btn-primary mb-4" onClick={toggleRecording}>
                  <Mic size={18} /> Ativar Afinador
                </button>
              ) : (
                <div className="live-note-display mb-4" style={{border: '2px solid var(--color-gold)', borderRadius: '10px', padding: '1rem'}}>
                  <p style={{margin: 0, color: '#666'}}>Afinador Ativo (Cantando agora):</p>
                  {currentNote ? <h2 style={{color: 'var(--color-primary)', margin: 0}}>{currentNote.name}</h2> : <h2 style={{color: '#ccc', margin: 0}}>--</h2>}
                  {currentNote && currentNote.freq < 150 && <p className="text-success mt-2"><strong>Ótimo grave!</strong></p>}
                </div>
              )}

              <div style={{padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1.5rem'}}>
                <code>[Am] A voz do meu a[E]mado...</code>
              </div>
              <p>O Afinador confirmou seu grave?</p>
              <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap'}}>
                <button className="btn btn-outline" onClick={() => handleEmpiricalGrave(false)}>
                  <ThumbsDown size={18} /> Não, subir capo
                </button>
                <button className="btn btn-primary" onClick={() => { if(isRecording) toggleRecording(); handleEmpiricalGrave(true); }}>
                  <ThumbsUp size={18} /> Sim, cravei a nota!
                </button>
              </div>
            </div>
          )}

          {step === 3 && mode === 'mic' && (
            <div className="step-pane text-center">
              <h2>Teste do Agudo</h2>
              <p className="mb-4">Agora cante a nota mais <strong>aguda</strong> que alcança sem esforço.</p>
              <div className={`mic-button ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
                <Mic size={32} />
              </div>
              <div className="live-note-display mt-3">
                {currentNote ? <h1 style={{color: 'var(--color-primary)', fontSize: '3rem', margin: 0}}>{currentNote.name}</h1> : <h1 style={{color: '#ccc', fontSize: '3rem', margin: 0}}>--</h1>}
                {maxNote && <p style={{color: '#666', marginTop: '1rem'}}>Nota Mais Aguda Salva: <strong>{maxNote.name}</strong></p>}
              </div>
              <button className="btn btn-primary mt-4" onClick={handleNext}>Finalizar</button>
            </div>
          )}

          {step === 3 && mode === 'empirical' && (
            <div className="step-pane text-center">
              <h2>Passo 3: Hora do Agudo</h2>
              <p className="mb-4">Agora o teste de agudo! Toque em <strong>Dó Maior (C)</strong> {empCapo <= 0 ? <strong>sem capotraste</strong> : <span>com capotraste na <strong>casa {empCapo}</strong></span>}.</p>
              
              {!isRecording ? (
                <button className="btn btn-primary mb-4" onClick={toggleRecording}>
                  <Mic size={18} /> Ativar Afinador
                </button>
              ) : (
                <div className="live-note-display mb-4" style={{border: '2px solid var(--color-gold)', borderRadius: '10px', padding: '1rem'}}>
                  <p style={{margin: 0, color: '#666'}}>Afinador Ativo (Cantando agora):</p>
                  {currentNote ? <h2 style={{color: 'var(--color-primary)', margin: 0}}>{currentNote.name}</h2> : <h2 style={{color: '#ccc', margin: 0}}>--</h2>}
                  {currentNote && currentNote.freq > 300 && <p className="text-success mt-2"><strong>Ótimo agudo!</strong></p>}
                </div>
              )}

              <div style={{padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1.5rem', fontFamily: 'monospace'}}>
                <span style={{color: 'var(--color-primary)'}}>Do</span>           <span style={{color: 'var(--color-primary)'}}>La-</span>     <span style={{color: 'var(--color-primary)'}}>Fa</span><br/>
                SE O SENHOR NÃO CONSTRÓI A CASA
              </div>
              <p>O Afinador confirmou seu agudo?</p>
              <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap'}}>
                <button className="btn btn-outline" onClick={() => handleEmpiricalAgudo(false)}>
                  <ThumbsDown size={18} /> Não alcanço, baixar capo
                </button>
                <button className="btn btn-primary" onClick={() => { if(isRecording) toggleRecording(); handleEmpiricalAgudo(true); }}>
                  <ThumbsUp size={18} /> Sim, cravei a nota!
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-pane text-center">
              <div className="icon-wrapper success mb-4">
                <CheckCircle size={64} />
              </div>
              <h2>Perfil Salvo!</h2>
              <p className="mb-2">Seu alcance vocal está guardado. A IA ajustará as cifras para você.</p>
              <p className="mb-4" style={{fontSize: '1.2rem', color: 'var(--color-secondary)'}}>
                Tipo de Voz: <strong>{getVoiceType((minNote?.freq || (82.41 * Math.pow(2, astOffsetGrave/12))), (maxNote?.freq || (392.00 * Math.pow(2, astOffsetAgudo/12))))}</strong>
              </p>
              <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
                Voltar aos Cantos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calibrador;
