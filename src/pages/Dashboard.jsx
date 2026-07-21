import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music, Volume2 } from 'lucide-react';
import { cantosData } from '../data';
import './Dashboard.css';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const allCantos = Object.values(cantosData);
  const cantos = allCantos.filter(canto => 
    canto.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const etapas = [
    { nome: 'Pré-Catecumenato', cor: 'branco', cantos: cantos.filter(c => c.cor === 'branco') },
    { nome: 'Catecumenato', cor: 'azul', cantos: cantos.filter(c => c.cor === 'azul') },
    { nome: 'Eleição', cor: 'verde', cantos: cantos.filter(c => c.cor === 'verde') },
    { nome: 'Liturgia', cor: 'amarelo', cantos: cantos.filter(c => c.cor === 'amarelo') }
  ];

  const [collapsedSections, setCollapsedSections] = useState({
    'branco': false,
    'azul': true,
    'verde': true,
    'amarelo': true
  });

  const toggleSection = (cor) => {
    setCollapsedSections(prev => ({
      ...prev,
      [cor]: !prev[cor]
    }));
  };

  return (
    <div className="container dashboard-page">

      <div className="search-bar-container mb-4">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por título..." 
            className="search-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="etapas-container">
        {etapas.map((etapa) => {
          const cantosOrdenados = etapa.cantos.sort((a, b) => a.titulo.localeCompare(b.titulo));
          const isCollapsed = collapsedSections[etapa.cor];
          
          return cantosOrdenados.length > 0 && (
            <div key={etapa.cor} className={`etapa-section etapa-${etapa.cor}`}>
              <div 
                className="etapa-header" 
                onClick={() => toggleSection(etapa.cor)}
                style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', padding: '0.5rem 0'}}
              >
                <h2 className="etapa-title" style={{margin: 0, borderBottom: 'none'}}>
                  {etapa.nome} <span style={{fontSize: '1rem', color: '#888', fontWeight: 'normal'}}>({cantosOrdenados.length})</span>
                </h2>
                <div style={{color: '#888', transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}>
                  ▼
                </div>
              </div>
              
              {!isCollapsed && (
                <div className="cantos-list" style={{marginTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem'}}>
                  {cantosOrdenados.map(canto => (
                    <Link to={`/canto/${canto.id}`} key={canto.id} className="canto-list-item">
                      <div className="canto-list-info" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        {canto.audio_url ? (
                          <Volume2 size={18} style={{marginRight: '12px', color: 'var(--color-primary)', flexShrink: 0}} title="Possui áudio" />
                        ) : (
                          <Music size={18} style={{marginRight: '12px', color: '#ccc', flexShrink: 0}} title="Sem áudio" />
                        )}
                        <span className="canto-list-title" style={{lineHeight: '1.3'}}>{canto.titulo}</span>
                      </div>
                      {canto.tom_original !== '?' && (
                        <span className="badge badge-outline canto-list-badge">{canto.tom_original}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {cantos.length === 0 && (
          <div className="text-center" style={{padding: '2rem'}}>
            <p>Nenhum canto encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
