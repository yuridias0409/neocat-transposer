import React from 'react';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function KaraokePanelView({ isKaraokeMode, userProfile, currentMicHz }) {
  if (!isKaraokeMode) return null;

  if (!userProfile) return (
    _jsxDEV("div", { className: "card text-center mb-3", style: { padding: '1rem', border: '1px solid #f87171', background: '#fef2f2' }, children:
      _jsxDEV("p", { style: { color: '#b91c1c', margin: 0 }, children: "Calibre sua voz primeiro para usar o Karaoke." }, void 0, false) }, void 0, false
    ));


  const userMaxFreq = userProfile.max.freq;
  const isDanger = currentMicHz > userMaxFreq;
  const isWarning = currentMicHz > userMaxFreq * 0.85 && !isDanger;

  const barColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';
  const percentage = Math.min(100, currentMicHz / (userMaxFreq * 1.2) * 100);

  return (
    _jsxDEV("div", { className: "karaoke-panel card mb-3", style: { padding: '1rem', border: '2px solid #0369a1', background: '#f0f9ff' }, children: [
      _jsxDEV("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0369a1' }, children: [
        _jsxDEV("span", { children: "🎤 Monitoramento ao Vivo" }, void 0, false),
        _jsxDEV("span", { children: currentMicHz > 0 ? `${currentMicHz} Hz` : 'Aguardando voz...' }, void 0, false)] }, void 0, true
      ),

      _jsxDEV("div", { style: { height: '24px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden', position: 'relative' }, children: [
        _jsxDEV("div", { style: {
            height: '100%',
            width: `${percentage}%`,
            background: barColor,
            transition: 'width 0.1s linear, background-color 0.3s'
          } }, void 0, false),

        _jsxDEV("div", { style: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${userMaxFreq / (userMaxFreq * 1.2) * 100}%`,
            width: '2px',
            background: '#b91c1c',
            zIndex: 10
          } }, void 0, false)] }, void 0, true
      ),

      _jsxDEV("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }, children: [
        _jsxDEV("span", { children: "Grave" }, void 0, false),
        _jsxDEV("span", { style: { color: '#b91c1c', fontWeight: 'bold' }, children: "Seu Limite Máximo" }, void 0, false)] }, void 0, true
      ),

      isDanger &&
      _jsxDEV("div", { style: { marginTop: '0.75rem', fontSize: '0.85rem', color: '#b91c1c', fontWeight: 'bold' }, children: "⚠️ Atenção: Você está atingindo ou ultrapassando seu limite de conforto vocal!" }, void 0, false

      )] }, void 0, true

    ));

}