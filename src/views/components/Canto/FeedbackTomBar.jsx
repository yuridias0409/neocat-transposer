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
      const result = await processarFeedbackEAprender({
        userId: user,
        cantoId,
        tipoFeedback: tipo,
        tomAtualSemitons
      });
      setSubmitted(true);

      if (result && result.requireRecalibration) {
        alert("Aviso: Notamos que você reportou vários cantos como inadequados. Recomendamos refazer a calibração de voz na página inicial para um resultado mais preciso.");
      }

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
        _jsxDEV("strong", { children: "Obrigado pelo feedback!" }, void 0, false), " O sistema está aprendendo o seu perfil vocal e ajustando as próximas sugestões."] }, void 0, true
      ));
  }

  return (
    _jsxDEV("div", { className: "mb-4", style: { background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }, children: [
      _jsxDEV("p", { style: { fontSize: '0.95rem', color: '#475569', textAlign: 'center', marginBottom: '1rem', fontWeight: '600' }, children: "Esse tom ficou confortável para sua voz?" }, void 0, false
      ),
      _jsxDEV("div", { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }, children: [
        _jsxDEV("button", {
          className: "btn",
          style: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '24px', padding: '0.4rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', flex: '1 1 auto', maxWidth: '200px', justifyContent: 'center' },
          onClick: () => handleFeedback('OPTIMAL'),
          disabled: loading, children: [
          _jsxDEV(ThumbsUp, { size: 16 }, void 0, false), " Ficou Ótimo"] }, void 0, true
        ),
        _jsxDEV("button", {
          className: "btn",
          style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '24px', padding: '0.4rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', flex: '1 1 auto', maxWidth: '200px', justifyContent: 'center' },
          onClick: () => handleFeedback('TOO_HIGH'),
          disabled: loading, children: [
          _jsxDEV(ThumbsDown, { size: 16 }, void 0, false), " Alto Demais"] }, void 0, true
        ),
        _jsxDEV("button", {
          className: "btn",
          style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '24px', padding: '0.4rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', flex: '1 1 auto', maxWidth: '200px', justifyContent: 'center' },
          onClick: () => handleFeedback('TOO_LOW'),
          disabled: loading, children: [
          _jsxDEV(ThumbsDown, { size: 16 }, void 0, false), " Baixo Demais"] }, void 0, true
        )] }, void 0, true
      )] }, void 0, true
    ));

};

export default FeedbackTomBar;