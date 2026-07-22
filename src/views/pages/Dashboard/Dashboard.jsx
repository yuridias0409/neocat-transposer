import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music, Volume2 } from 'lucide-react';
import { cantosData } from '../../../data';
import './Dashboard.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');

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
                canto.tom_original !== '?' &&
                _jsxDEV("span", { className: "badge badge-outline canto-list-badge", children: canto.tom_original }, void 0, false)] }, canto.id, true

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