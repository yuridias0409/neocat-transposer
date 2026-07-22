import React from 'react';
import { useParams } from 'react-router-dom';
import { Settings2, SlidersHorizontal, Users, Book, ThumbsUp, ThumbsDown } from 'lucide-react';
import { transposeChordString } from '../../../utils';
import { useCantoController } from '../../../controllers/useCantoController';
import { AudioPlayerView } from '../../components/Canto/AudioPlayerView';
import { KaraokePanelView } from '../../components/Canto/KaraokePanelView';
import './Canto.css'; // Keep the existing CSS for now, I will move it later

const Canto = ({ user }) => {
  const { id } = useParams();
  
  const {
    canto,
    transposition, setTransposition,
    isPlaying, togglePlay,
    isAudioLoaded, progress, currentTime, duration, handleSeek,
    userProfile,
    notes, setNotes, showNotes, setShowNotes, saveNotes,
    showChordGuide, setShowChordGuide,
    isKaraokeMode, currentMicHz, startKaraoke, stopKaraoke,
    showFeedback, feedbackSent, handleFeedback,
    toastMessage, showToast
  } = useCantoController(id, user);

  if (!canto) return <div className="container canto-page"><p>Canto não encontrado.</p></div>;

  const tomAtualVisual = transposeChordString(canto.tom_original, transposition);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calcularAjusteMagico = () => {
    if (!userProfile || !canto.freq_max_curada || !canto.freq_min_curada) {
      showToast("Precisamos do seu perfil vocal calibrado e dos dados do canto para calcular.");
      return;
    }
    const cantoMaxSemi = 12 * Math.log2(canto.freq_max_curada / 440) + 69;
    const salmistaMaxSemi = 12 * Math.log2(userProfile.max.freq / 440) + 69;
    let ajuste = 0;
    if (cantoMaxSemi > salmistaMaxSemi) {
      ajuste = Math.floor(salmistaMaxSemi - cantoMaxSemi);
    }
    setTransposition(ajuste);
  };

  const renderAssemblyStatus = () => {
    const songMaxFreq = canto.freq_max_curada || canto.freq_max_global;
    if (!songMaxFreq || songMaxFreq === -Infinity) return null;

    const currentMaxFreq = songMaxFreq * Math.pow(2, transposition / 12);
    const assemblyMaxLimit = 246.94; // B3
    const idealAssemblyTransposition = Math.floor(12 * Math.log2(assemblyMaxLimit / songMaxFreq));
    const capoEquiv = transposition - idealAssemblyTransposition > 0 && transposition - idealAssemblyTransposition <= 11;
    
    if (capoEquiv) return null;

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
        <div className="alert alert-warning mb-4" style={{backgroundColor: '#fef3c7', color: '#92400e', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a'}}>
          <strong><Users size={18} style={{marginRight: '0.5rem', verticalAlign: 'text-bottom'}} /> Assembleia Desconfortável</strong> 
          <p style={{margin: '0.5rem 0 0 0'}}>O refrão está muito agudo para o povo. Sugerimos {idealAssemblyTransposition > 0 ? `+${idealAssemblyTransposition}` : idealAssemblyTransposition} semitons se a prioridade for a participação da assembleia.</p>
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
        <>
          <AudioPlayerView 
            canto={canto}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            isAudioLoaded={isAudioLoaded}
            progress={progress}
            currentTime={currentTime}
            duration={duration}
            handleSeek={handleSeek}
            isKaraokeMode={isKaraokeMode}
            startKaraoke={startKaraoke}
            stopKaraoke={stopKaraoke}
            formatTime={formatTime}
          />
          <KaraokePanelView 
            isKaraokeMode={isKaraokeMode}
            userProfile={userProfile}
            currentMicHz={currentMicHz}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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
        </>
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
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
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
