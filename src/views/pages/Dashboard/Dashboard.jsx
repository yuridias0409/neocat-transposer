import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music, Volume2 } from 'lucide-react';
import { cantosData } from '../../../data';
import { otimizarCapoETom } from '../../../utils/capoEngine';
import { calcularTomIdealInteligente } from '../../../utils/transpositionEngine';
import capoIcon from '../../../assets/capotraste.png';
import './Dashboard.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  React.useEffect(() => {
    try {
      const p = localStorage.getItem('userVoiceProfile');
      if (p) setUserProfile(JSON.parse(p));
    } catch (e) {}
  }, []);

  const allCantos = Object.values(cantosData);
  const cantos = allCantos.filter((canto) =>
  canto.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const etapas = [
  { nome: 'Pré-Catecumenato', cor: 'branco', cantos: cantos.filter((c) => c.cor === 'branco') },
  { nome: 'Catecumenato', cor: 'azul', cantos: cantos.filter((c) => c.cor === 'azul') },
  { nome: 'Eleição', cor: 'verde', cantos: cantos.filter((c) => c.cor === 'verde') },
  { nome: 'Liturgia', cor: 'amarelo', cantos: cantos.filter((c) => c.cor === 'amarelo') }];


  const [collapsedSections, setCollapsedSections] = useState({
    'branco': false,
    'azul': true,
    'verde': true,
    'amarelo': true
  });

  const toggleSection = (cor) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [cor]: !prev[cor]
    }));
  };

  return (
    _jsxDEV("div", { className: "container dashboard-page", children: [

      _jsxDEV("div", { className: "search-bar-container mb-4", children:
        _jsxDEV("div", { className: "search-bar", children: [
          _jsxDEV(Search, { size: 20, className: "search-icon" }, void 0, false),
          _jsxDEV("input", {
            type: "text",
            placeholder: "Buscar por título...",
            className: "search-input",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value) }, void 0, false
          )] }, void 0, true
        ) }, void 0, false
      ),

      _jsxDEV("div", { className: "etapas-container", children: [
        etapas.map((etapa) => {
          const cantosOrdenados = etapa.cantos.sort((a, b) => a.titulo.localeCompare(b.titulo));
          const isCollapsed = collapsedSections[etapa.cor];

          return cantosOrdenados.length > 0 &&
          _jsxDEV("div", { className: `etapa-section etapa-${etapa.cor}`, children: [
            _jsxDEV("div", {
              className: "etapa-header",
              onClick: () => toggleSection(etapa.cor),
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', padding: '0.5rem 0' }, children: [

              _jsxDEV("h2", { className: "etapa-title", style: { margin: 0, borderBottom: 'none' }, children: [
                etapa.nome, " ", _jsxDEV("span", { style: { fontSize: '1rem', color: '#888', fontWeight: 'normal' }, children: ["(", cantosOrdenados.length, ")"] }, void 0, true)] }, void 0, true
              ),
              _jsxDEV("div", { style: { color: '#888', transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }, children: "▼" }, void 0, false

              )] }, void 0, true
            ),

            !isCollapsed &&
            _jsxDEV("div", { className: "cantos-list", style: { marginTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }, children:
              cantosOrdenados.map((canto) =>
              _jsxDEV(Link, { to: `/canto/${canto.id}`, className: "canto-list-item", children: [
                _jsxDEV("div", { className: "canto-list-info", style: { display: 'flex', alignItems: 'center', flex: 1 }, children: [
                  canto.audio_url ?
                  _jsxDEV(Volume2, { size: 18, style: { marginRight: '12px', color: 'var(--color-primary)', flexShrink: 0 }, title: "Possui áudio" }, void 0, false) :

                  _jsxDEV(Music, { size: 18, style: { marginRight: '12px', color: '#ccc', flexShrink: 0 }, title: "Sem áudio" }, void 0, false),

                  _jsxDEV("span", { className: "canto-list-title", style: { lineHeight: '1.3' }, children: canto.titulo }, void 0, false)] }, void 0, true
                ),
                (() => {
                  const savedOffset = userProfile?.cantos_validados?.[canto.id];
                  let offsetToUse = savedOffset;
                  let isSaved = true;

                  if (savedOffset === undefined && userProfile) {
                    const vozSalmista = {
                      minHz: userProfile.f0_min || 110,
                      maxHz: userProfile.f0_max || 330,
                      tipoVoz: userProfile.tipoVoz || 'Desconhecido'
                    };
                    const res = calcularTomIdealInteligente(vozSalmista, canto, userProfile);
                    if (res) offsetToUse = res.semitones;
                    isSaved = false;
                  }

                  if (offsetToUse !== undefined && canto.tom_original !== '?') {
                    const capoData = otimizarCapoETom(canto.tom_original, offsetToUse);
                    return _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [
                      isSaved && _jsxDEV("span", { title: "Confirmado na Memória", style: { fontSize: '14px' }, children: "✅" }, void 0, false),
                      _jsxDEV("span", { style: { background: isSaved ? '#dcfce7' : '#e0f2fe', color: isSaved ? '#166534' : '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }, children: ["🎸 ", capoData.formaAcorde] }, void 0, true),
                      capoData.capoCasa > 0 && _jsxDEV("span", { style: { background: isSaved ? '#dcfce7' : '#fef3c7', color: isSaved ? '#166534' : '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }, children: [
                        _jsxDEV("img", { src: capoIcon, alt: "Capo", style: { width: '14px', height: '14px', filter: isSaved ? 'none' : 'hue-rotate(20deg) saturate(150%) brightness(0.8)' } }, void 0, false), `Capo ${capoData.capoCasa}ª`
                      ] }, void 0, true)
                    ] }, void 0, true);
                  }
                  return canto.tom_original !== '?' && _jsxDEV("span", { className: "badge badge-outline canto-list-badge", children: canto.tom_original }, void 0, false);
                })()] }, canto.id, true

              )
              ) }, void 0, false
            )] }, etapa.cor, true

          );

        }),
        cantos.length === 0 &&
        _jsxDEV("div", { className: "text-center", style: { padding: '2rem' }, children:
          _jsxDEV("p", { children: "Nenhum canto encontrado." }, void 0, false) }, void 0, false
        )] }, void 0, true

      )] }, void 0, true
    ));

};

export default Dashboard;