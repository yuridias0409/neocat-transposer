import React from 'react';
import { X, Info } from 'lucide-react';
import { otimizarCapoETom } from '../../../utils/capoEngine';
import capoIcon from '../../../assets/capotraste.png';
import { PsalmistStatus } from './PsalmistStatus';
import { AssemblyStatus } from './AssemblyStatus';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export const ToneInfoModal = ({
  showSobreModal,
  setShowSobreModal,
  aiData,
  canto,
  capoInfo,
  userProfile,
  transposition
}) => {
  if (!showSobreModal || !aiData) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto', background: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <button onClick={() => setShowSobreModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={24} />
        </button>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0369a1', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
          <Info size={20} /> Sobre este tom
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>Análise do tom atual ({capoInfo.formaAcorde}{capoInfo.capoCasa > 0 ? ` Capo ${capoInfo.capoCasa}ª` : ''})</h4>
          <PsalmistStatus userProfile={userProfile} aiData={aiData} transposition={transposition} canto={canto} />
          <AssemblyStatus canto={canto} transposition={transposition} />
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: '500', textAlign: 'center', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>{aiData.mensagem || "Calculado pelo motor centralizado."}</p>

        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Tom ideal seu:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.4rem 0.6rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                🎸 Toque<br />{otimizarCapoETom(canto.tom_original, aiData.semitones).formaAcorde}
              </span>
              {otimizarCapoETom(canto.tom_original, aiData.semitones).capoCasa > 0 && (
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.4rem 0.6rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
                  <img src={capoIcon} alt="Capo" style={{ width: '14px', height: '14px', marginBottom: '2px', opacity: 0.8 }} /> Capo {otimizarCapoETom(canto.tom_original, aiData.semitones).capoCasa}ª
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Tom ideal p/ assembleia:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.4rem 0.6rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                🎸 Toque<br />{otimizarCapoETom(canto.tom_original, (() => {const songMaxFreq = canto.freq_max_curada || canto.freq_max_global; if (!songMaxFreq || songMaxFreq === -Infinity) return aiData.semitones; return Math.floor(12 * Math.log2(246.94 / songMaxFreq));})()).formaAcorde}
              </span>
              {otimizarCapoETom(canto.tom_original, (() => {const songMaxFreq = canto.freq_max_curada || canto.freq_max_global; if (!songMaxFreq || songMaxFreq === -Infinity) return aiData.semitones; return Math.floor(12 * Math.log2(246.94 / songMaxFreq));})()).capoCasa > 0 && (
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.4rem 0.6rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
                  <img src={capoIcon} alt="Capo" style={{ width: '14px', height: '14px', marginBottom: '2px', opacity: 0.8 }} /> Capo {otimizarCapoETom(canto.tom_original, (() => {const songMaxFreq = canto.freq_max_curada || canto.freq_max_global; if (!songMaxFreq || songMaxFreq === -Infinity) return aiData.semitones; return Math.floor(12 * Math.log2(246.94 / songMaxFreq));})()).capoCasa}ª
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button className="btn btn-primary w-100" onClick={() => setShowSobreModal(false)} style={{ marginTop: 'auto', backgroundColor: '#991b1b', borderColor: '#991b1b', fontFamily: 'var(--font-heading)' }}>Entendi</button>
      </div>
    </div>
  );
};
