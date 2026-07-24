import React from 'react';
import { X, Info, Activity } from 'lucide-react';
import { otimizarCapoETom } from '../../../utils/capoEngine';
import capoIcon from '../../../assets/capotraste.png';
import { PsalmistStatus } from './PsalmistStatus';
import { AssemblyStatus } from './AssemblyStatus';

const ComfortMapVisualization = ({ title, songMin, songMax, targetMin, targetMax, alignOctaves, labelTarget }) => {
  let tMin = songMin;
  let tMax = songMax;

  if (alignOctaves) {
    const userCenter = (targetMax + targetMin) / 2;
    while (true) {
      let currentCenter = (tMax + tMin) / 2;
      if (Math.abs((currentCenter * 2) - userCenter) < Math.abs(currentCenter - userCenter)) {
        tMax *= 2;
        tMin *= 2;
      } else break;
    }
    while (true) {
      let currentCenter = (tMax + tMin) / 2;
      if (Math.abs((currentCenter / 2) - userCenter) < Math.abs(currentCenter - userCenter)) {
        tMax /= 2;
        tMin /= 2;
      } else break;
    }
  }

  const chartMin = 65; 
  const chartMax = 700; 
  const getPitch = (freq) => Math.log2(Math.max(freq, 1));
  const minPitch = getPitch(chartMin);
  const maxPitch = getPitch(chartMax);
  
  const getPercent = (freq) => {
    if (!freq) return 0;
    const p = getPitch(freq);
    return Math.max(0, Math.min(100, ((p - minPitch) / (maxPitch - minPitch)) * 100));
  };

  const leftPercent = getPercent(tMin);
  const widthPercent = getPercent(tMax) - leftPercent;
  const greenLeftPercent = getPercent(targetMin);
  const greenWidthPercent = getPercent(targetMax) - greenLeftPercent;

  const overflowLow = tMin < targetMin - 10;
  const overflowHigh = tMax > targetMax + 10;
  
  let barColor = '#3b82f6'; 
  if (overflowHigh && overflowLow) barColor = '#f59e0b'; 
  else if (overflowHigh) barColor = '#ef4444'; 
  else if (overflowLow) barColor = '#8b5cf6'; 

  return (
    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h5 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8' }}>Visão de frequências</span>
      </h5>
      
      <div style={{ position: 'relative', height: '28px', background: '#f1f5f9', borderRadius: '14px', overflow: 'hidden', border: '1px inset rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'absolute', left: `${greenLeftPercent}%`, width: `${greenWidthPercent}%`, height: '100%', background: 'rgba(34, 197, 94, 0.15)', borderLeft: '2px dashed #22c55e', borderRight: '2px dashed #22c55e' }} title="Zona Confortável"></div>
        <div style={{ position: 'absolute', top: '6px', height: '16px', left: `${leftPercent}%`, width: `${widthPercent}%`, background: barColor, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', transition: 'all 0.4s ease' }} title="Alcance do Canto"></div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', fontWeight: '500' }}>
        <span>Grave</span>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px dashed #22c55e', borderRadius: '2px' }}></div> 
            {labelTarget}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: barColor, borderRadius: '2px' }}></div> 
            Canto
          </span>
        </div>
        <span>Agudo</span>
      </div>
    </div>
  );
};

export const ToneInfoModal = ({
  showSobreModal,
  setShowSobreModal,
  aiData,
  canto,
  capoInfo,
  userProfile,
  transposition,
  tomEsforco
}) => {
  if (!showSobreModal || !aiData) return null;

  const isAssembly = showSobreModal === 'assembly';
  
  // Determine which transposition we are analyzing
  const activeTransposition = isAssembly && tomEsforco !== null && tomEsforco !== undefined ? tomEsforco : transposition;
  const activeCapoInfo = isAssembly ? otimizarCapoETom(canto.tom_original, activeTransposition) : capoInfo;

  const titleText = isAssembly ? "Análise do tom da Assembleia" : "Análise do seu tom";
  
  const songMinFreq = canto.freq_min_curada || canto.freq_min_global;
  const songMaxFreq = canto.freq_max_curada || canto.freq_max_global;
  
  let transposedMinFreq = songMinFreq * Math.pow(2, activeTransposition / 12);
  let transposedMaxFreq = songMaxFreq * Math.pow(2, activeTransposition / 12);
  
  if (!transposedMinFreq || !isFinite(transposedMinFreq)) transposedMinFreq = 110;
  if (!transposedMaxFreq || !isFinite(transposedMaxFreq)) transposedMaxFreq = 330;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: isAssembly ? '500px' : '900px', position: 'relative', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto', background: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <button onClick={() => setShowSobreModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'color 0.2s' }}>
          <X size={24} />
        </button>
        
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0f172a', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
          <Activity size={20} color="#0369a1" /> Análise de Conforto
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '1.05rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {titleText} 
            <div className="badges-row" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
              <div className={`badge-inst ${isAssembly ? 'badge-inst-assembly-chord' : 'badge-inst-chord'}`}>
                🎸 Toque {activeCapoInfo.formaAcorde}
              </div>
              {activeCapoInfo.capoCasa > 0 && (
                <div className={`badge-inst ${isAssembly ? 'badge-inst-assembly-capo' : 'badge-inst-capo'}`}>
                  <img src={capoIcon} alt="capo" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                  Capo {activeCapoInfo.capoCasa}ª
                </div>
              )}
            </div>
          </h4>
          
          {isAssembly ? (
            <>
              <AssemblyStatus canto={canto} transposition={activeTransposition} />
              <ComfortMapVisualization 
                title="Mapa de Calor Vocal"
                songMin={transposedMinFreq} songMax={transposedMaxFreq}
                targetMin={110} targetMax={246.94}
                alignOctaves={false}
                labelTarget="Zona Segura"
              />
            </>
          ) : (
            <div className="tone-modal-grid">
              <div className="tone-modal-col">
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '1.05rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Impacto na Sua Voz
                </h4>
                <PsalmistStatus userProfile={userProfile} aiData={aiData} transposition={activeTransposition} canto={canto} />
                <ComfortMapVisualization 
                  title="Seu Mapa de Calor Vocal"
                  songMin={transposedMinFreq} songMax={transposedMaxFreq}
                  targetMin={userProfile?.min?.freq || userProfile?.f0_min || 110}
                  targetMax={userProfile?.max?.freq || userProfile?.f0_max || 330}
                  alignOctaves={true}
                  labelTarget="Sua Voz"
                />
              </div>
              
              <div className="tone-modal-col" style={{ marginTop: '0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '1.05rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Impacto na Assembleia
                </h4>
                <AssemblyStatus canto={canto} transposition={activeTransposition} />
                <div style={{ marginTop: '0.75rem' }}>
                  <ComfortMapVisualization 
                    title="Mapa de Calor Vocal (Assembleia)"
                    songMin={transposedMinFreq} songMax={transposedMaxFreq}
                    targetMin={110} targetMax={246.94}
                    alignOctaves={false}
                    labelTarget="Povo"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button className="btn btn-primary w-100" onClick={() => setShowSobreModal(false)} style={{ marginTop: '0.5rem', backgroundColor: '#0f172a', borderColor: '#0f172a', fontFamily: 'var(--font-heading)', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px' }}>
          Entendi
        </button>
      </div>
    </div>
  );
};
