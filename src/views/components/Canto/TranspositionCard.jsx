import React from 'react';
import { Settings2, ThumbsUp, Info } from 'lucide-react';
import { otimizarCapoETom } from '../../../utils/capoEngine';
import capoIcon from '../../../assets/capotraste.png';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export const TranspositionCard = ({
  transposition,
  setTransposition,
  capoInfo,
  baseOffset,
  initialTransposition,
  canto,
  aplicarTomInteligente,
  user,
  salvarTomPreferido,
  isToneSaved,
  setShowSobreModal,
  tomEsforco,
  setTomEsforco,
  aiData
}) => {
  return (
    <div className="card text-center transpo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#555', marginBottom: '0.75rem', fontWeight: 'bold' }}>Transposição</div>

      <div className="transposition-controls" style={{ background: '#fdfbf7', padding: '0.5rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <button className="btn-circle btn-sm" onClick={() => setTransposition((t) => t - 1)} style={{ width: '30px', height: '30px', minWidth: '30px' }}>-</button>
        <span className="transposition-value" style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#851d1d', margin: '0 1.5rem', minWidth: '45px' }}>{capoInfo.tomReal}</span>
        <button className="btn-circle btn-sm" onClick={() => setTransposition((t) => t + 1)} style={{ width: '30px', height: '30px', minWidth: '30px' }}>+</button>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span>
          {transposition - baseOffset === 0 ? '0' : transposition - baseOffset > 0 ? `+${transposition - baseOffset}` : transposition - baseOffset} semitons
        </span>
        {capoInfo.formaAcorde !== '?' && (transposition !== baseOffset || transposition !== initialTransposition) && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>🎸 Toque {capoInfo.formaAcorde}</span>
            {capoInfo.capoCasa > 0 && (
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <img src={capoIcon} alt="Capo" style={{ width: '16px', height: '16px' }} /> Capo {capoInfo.capoCasa}ª
              </span>
            )}
          </div>
        )}

        {(() => {
          if (tomEsforco === null || tomEsforco === undefined || canto.tom_original === '?') return null;
          const assCapo = otimizarCapoETom(canto.tom_original, tomEsforco);
          
          if (assCapo.tomReal === capoInfo.tomReal && assCapo.capoCasa === capoInfo.capoCasa && assCapo.formaAcorde === capoInfo.formaAcorde) return null;
          
          return (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem', alignItems: 'center', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#555', fontWeight: '500', whiteSpace: 'nowrap' }}>Assembleia:</span>
              <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>🎸 Toque {assCapo.formaAcorde}</span>
              {assCapo.capoCasa > 0 && (
                <span style={{ background: '#fce7f3', color: '#be185d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                  <img src={capoIcon} alt="Capo" style={{ width: '16px', height: '16px', filter: 'grayscale(100%) brightness(0.4) sepia(1) hue-rotate(300deg) saturate(300%)' }} /> Capo {assCapo.capoCasa}ª
                </span>
              )}
            </div>
          );
        })()}

        {canto.audio_url && canto.tom_audio && canto.tom_audio !== '?' && (
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>Áudio gravado em {canto.tom_audio}</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto' }}>
        <button className="btn btn-secondary btn-sm" onClick={aplicarTomInteligente} style={{ flex: '1 1 140px' }}>
          <Settings2 size={14} style={{ marginRight: '0.4rem' }} /> Recalibrar
        </button>
        {user && (
          <button className="btn btn-outline btn-sm" onClick={salvarTomPreferido} disabled={isToneSaved} style={{ flex: '1 1 140px', borderColor: isToneSaved ? '#86efac' : '#bbf7d0', color: isToneSaved ? '#166534' : '#16a34a', background: isToneSaved ? '#dcfce7' : '#f0fdf4', opacity: 1 }}>
            <ThumbsUp size={14} style={{ marginRight: '0.4rem' }} /> {isToneSaved ? " Tom Favoritado" : " Favoritar Tom"}
          </button>
        )}
        {aiData && (
          <button className="btn btn-outline btn-sm" onClick={() => setShowSobreModal(true)} style={{ flex: '1 1 100%', borderColor: '#cbd5e1', color: '#334155', marginTop: '0.5rem', background: 'transparent' }}>
            <Info size={14} style={{ marginRight: '0.4rem' }} /> Sobre este tom
          </button>
        )}

        {tomEsforco !== null && tomEsforco !== transposition && (
          <button className="btn btn-outline btn-sm w-100" onClick={() => {setTransposition(tomEsforco);setTomEsforco(null);}} style={{ borderColor: '#fcd34d', color: '#b45309', background: '#fffbeb' }}>💡 Sugestão: Tentar Tom de Esforço</button>
        )}
      </div>
    </div>
  );
};
