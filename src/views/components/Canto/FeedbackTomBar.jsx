import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { processarFeedbackEAprender } from '../../../utils/FeedbackEngine';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

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
      _jsxDEV("div", { style: { padding: '0.75rem', background: '#e6f4ea', color: '#16a34a', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }, children: [
        _jsxDEV("strong", { children: "Obrigado pelo feedback!" }, void 0, false), " Seu perfil foi ajustado para melhorar as próximas sugestões."] }, void 0, true
      ));

  }

  return (
    _jsxDEV("div", { style: { marginTop: '1.5rem', background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }, children: [
      _jsxDEV("p", { style: { fontSize: '0.9rem', color: '#555', textAlign: 'center', marginBottom: '0.75rem' }, children: "A sugestão de tom inteligente funcionou bem para você?" }, void 0, false

      ),
      _jsxDEV("div", { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }, children: [
        _jsxDEV("button", {
          className: "btn btn-sm",
          style: { background: '#e6f4ea', color: '#16a34a', border: '1px solid #bbf7d0', flex: 1, minWidth: '100px' },
          onClick: () => handleFeedback('OPTIMAL'),
          disabled: loading, children: [

          _jsxDEV(ThumbsUp, { size: 16 }, void 0, false), " Ficou ótimo"] }, void 0, true
        ),
        _jsxDEV("button", {
          className: "btn btn-sm",
          style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', flex: 1, minWidth: '100px' },
          onClick: () => handleFeedback('TOO_HIGH'),
          disabled: loading, children: [

          _jsxDEV(ThumbsDown, { size: 16 }, void 0, false), " Alto demais"] }, void 0, true
        ),
        _jsxDEV("button", {
          className: "btn btn-sm",
          style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', flex: 1, minWidth: '100px' },
          onClick: () => handleFeedback('TOO_LOW'),
          disabled: loading, children: [

          _jsxDEV(ThumbsDown, { size: 16 }, void 0, false), " Baixo demais"] }, void 0, true
        )] }, void 0, true
      )] }, void 0, true
    ));

};

export default FeedbackTomBar;