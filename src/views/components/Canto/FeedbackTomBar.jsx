import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { processarFeedbackEAprender } from '../../../utils/FeedbackEngine';

const FeedbackTomBar = ({ user, cantoId, tomAtualSemitons, onFeedbackApplied }) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (tipo) => {
    if (!user) return;
    setLoading(true);
    try {
      await processarFeedbackEAprender({
        userId: user,
        cantoId,
        tipoFeedback: tipo,
        tomAtualSemitons
      });
      setSubmitted(true);
      
      // Se ficou alto, baixa 1 semitom, se ficou baixo, sobe 1 semitom para aplicar já na UI
      let offsetUi = 0;
      if (tipo === 'TOO_HIGH') offsetUi = -1;
      if (tipo === 'TOO_LOW') offsetUi = 1;
      
      if (onFeedbackApplied) {
        onFeedbackApplied(offsetUi);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar feedback.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '0.75rem', background: '#e6f4ea', color: '#16a34a', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>
        <strong>Obrigado pelo feedback!</strong> Seu perfil foi ajustado para melhorar as próximas sugestões.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem', background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
      <p style={{ fontSize: '0.9rem', color: '#555', textAlign: 'center', marginBottom: '0.75rem' }}>
        A sugestão de tom inteligente funcionou bem para você?
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          className="btn btn-sm" 
          style={{ background: '#e6f4ea', color: '#16a34a', border: '1px solid #bbf7d0', flex: 1, minWidth: '100px' }}
          onClick={() => handleFeedback('OPTIMAL')}
          disabled={loading}
        >
          <ThumbsUp size={16} /> Ficou ótimo
        </button>
        <button 
          className="btn btn-sm" 
          style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', flex: 1, minWidth: '100px' }}
          onClick={() => handleFeedback('TOO_HIGH')}
          disabled={loading}
        >
          <ThumbsDown size={16} /> Alto demais
        </button>
        <button 
          className="btn btn-sm" 
          style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', flex: 1, minWidth: '100px' }}
          onClick={() => handleFeedback('TOO_LOW')}
          disabled={loading}
        >
          <ThumbsDown size={16} /> Baixo demais
        </button>
      </div>
    </div>
  );
};

export default FeedbackTomBar;
