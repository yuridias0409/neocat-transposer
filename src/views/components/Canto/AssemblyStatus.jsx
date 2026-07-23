import React from 'react';
import { Users } from 'lucide-react';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export const AssemblyStatus = ({ canto, transposition }) => {
  const songMaxFreq = canto.freq_max_curada || canto.freq_max_global;
  if (!songMaxFreq || songMaxFreq === -Infinity) return null;

  const currentMaxFreq = songMaxFreq * Math.pow(2, transposition / 12);
  const assemblyMaxLimit = 246.94;
  
  const diffAssSemitones = 12 * Math.log2(currentMaxFreq / assemblyMaxLimit);

  if (diffAssSemitones <= 0) {
    return (
      <div className="alert alert-success mb-2" style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.9rem' }}>
        <strong><Users size={16} style={{ marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Assembleia Confortável</strong>
        <p style={{ margin: '0.2rem 0 0 0' }}>O refrão está num tom muito bom para todos cantarem juntos!</p>
      </div>
    );
  } else if (diffAssSemitones <= 2) {
    return (
      <div className="alert alert-warning mb-2" style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.9rem' }}>
        <strong><Users size={16} style={{ marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Assembleia com Leve Esforço</strong>
        <p style={{ margin: '0.2rem 0 0 0' }}>O refrão está levemente agudo, mas o povo consegue cantar.</p>
      </div>
    );
  } else {
    return (
      <div className="alert alert-danger mb-2" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem' }}>
        <strong><Users size={16} style={{ marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Assembleia Muito Desconfortável</strong>
        <p style={{ margin: '0.2rem 0 0 0' }}>O refrão está muito agudo para o povo. Sugerimos baixar {Math.ceil(diffAssSemitones)} semitons.</p>
      </div>
    );
  }
};
