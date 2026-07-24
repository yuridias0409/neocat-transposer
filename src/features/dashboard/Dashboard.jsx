import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Music, Volume2, ChevronDown } from "lucide-react";
import { cantosData } from "../../data";
import { otimizarCapoETom } from "../../domain/capoEngine";
import { calcularTomIdealInteligente } from "../../domain/transpositionEngine";
import CantoDAO from "../../api/CantoDAO";
import capoIcon from "../../assets/capotraste.png";
import "./Dashboard.css";
const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [allIntelligentData, setAllIntelligentData] = useState({});
  useEffect(() => {
    try {
      const p = localStorage.getItem("userVoiceProfile");
      if (p) setUserProfile(JSON.parse(p));
    } catch (e) {}
    CantoDAO.getAllIntelligentData()
      .then(setAllIntelligentData)
      .catch(console.error);
  }, []);
  const allCantos = Object.values(cantosData);
  const cantos = allCantos.filter((canto) =>
    canto.titulo.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const etapas = [
    {
      nome: "Pré-Catecumenato",
      cor: "branco",
      cantos: cantos.filter((c) => c.cor === "branco"),
    },
    {
      nome: "Catecumenato",
      cor: "azul",
      cantos: cantos.filter((c) => c.cor === "azul"),
    },
    {
      nome: "Eleição",
      cor: "verde",
      cantos: cantos.filter((c) => c.cor === "verde"),
    },
    {
      nome: "Liturgia",
      cor: "amarelo",
      cantos: cantos.filter((c) => c.cor === "amarelo"),
    },
  ];
  const [collapsedSections, setCollapsedSections] = useState({
    branco: false,
    azul: true,
    verde: true,
    amarelo: true,
  });
  const toggleSection = (cor) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [cor]: !prev[cor],
    }));
  };
  return (
    <div className="container dashboard-page">
      <div className="dashboard-header-modern">
        <h1 className="font-neocat">Cantos</h1>
        <p className="font-neocat">
          Explore o repertório do Caminho Neocatecumenal
        </p>
      </div>

      <div className="search-bar-container">
        <div className="search-bar-modern">
          <Search size={22} className="search-icon" />
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
          const cantosOrdenados = etapa.cantos.sort((a, b) =>
            a.titulo.localeCompare(b.titulo),
          );
          const isCollapsed = collapsedSections[etapa.cor];
          if (cantosOrdenados.length === 0) return null;
          return (
            <div key={etapa.cor} className={`etapa-card etapa-${etapa.cor}`}>
              <div
                className="etapa-header"
                onClick={() => toggleSection(etapa.cor)}
              >
                <h2 className="etapa-title">
                  {etapa.nome}{" "}
                  <span className="etapa-count">
                    ({cantosOrdenados.length})
                  </span>
                </h2>
                <ChevronDown
                  className="etapa-chevron"
                  size={24}
                  style={{
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  }}
                />
              </div>

              <div
                className={`cantos-grid ${isCollapsed ? "collapsed" : "expanded"}`}
              >
                {cantosOrdenados.map((canto) => {
                  const savedOffset = userProfile?.cantos_validados?.[canto.id];
                  let offsetToUse = savedOffset;
                  let isSaved = true;
                  if (savedOffset === undefined && userProfile) {
                    const vozSalmista = {
                      minHz: userProfile.min?.freq || userProfile.f0_min || 110,
                      maxHz: userProfile.max?.freq || userProfile.f0_max || 330,
                      tipoVoz: userProfile.tipoVoz || "Desconhecido",
                    };
                    const res = calcularTomIdealInteligente(
                      vozSalmista,
                      canto,
                      userProfile,
                      allIntelligentData[canto.id] || {},
                    );
                    if (res) {
                      let resOffset = res.semitones;
                      resOffset = ((resOffset % 12) + 12) % 12;
                      if (resOffset > 6) resOffset -= 12;
                      offsetToUse = resOffset;
                    }
                    isSaved = false;
                  }
                  return (
                    <Link
                      to={`/canto/${canto.id}`}
                      state={{
                        precomputedOffset: offsetToUse,
                      }}
                      className="canto-card"
                      key={canto.id}
                    >
                      <div className="canto-card-content">
                        <div className="canto-icon-box">
                          {canto.audio_url ? (
                            <Volume2
                              size={20}
                              className="icon-audio"
                              title="Possui áudio"
                            />
                          ) : (
                            <Music
                              size={20}
                              className="icon-no-audio"
                              title="Sem áudio"
                            />
                          )}
                        </div>
                        <span className="canto-card-title">{canto.titulo}</span>
                      </div>

                      <div className="canto-card-badges">
                        {offsetToUse !== undefined && canto.tom_original !== "?"
                          ? (() => {
                              const capoData = otimizarCapoETom(
                                canto.tom_original,
                                offsetToUse,
                              );
                              return (
                                <div className="capo-badges-wrapper">
                                  <span
                                    className={`badge-chord ${isSaved ? "saved" : "suggested"}`}
                                  >
                                    {isSaved && (
                                      <span
                                        className="saved-indicator"
                                        title="Confirmado na Memória"
                                      >
                                        ✅
                                      </span>
                                    )}
                                    🎸 {capoData.formaAcorde}
                                  </span>
                                  {capoData.capoCasa > 0 && (
                                    <span
                                      className={`badge-capo ${isSaved ? "saved" : "suggested"}`}
                                    >
                                      <img
                                        src={capoIcon}
                                        alt="Capo"
                                        className="capo-icon-img"
                                        style={{
                                          filter: isSaved
                                            ? "none"
                                            : "hue-rotate(20deg) saturate(150%) brightness(0.8)",
                                        }}
                                      />
                                      Capo {capoData.capoCasa}ª
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          : canto.tom_original !== "?" && (
                              <span className="badge-original">
                                {canto.tom_original}
                              </span>
                            )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        {cantos.length === 0 && (
          <div className="empty-state">
            <p>Nenhum canto encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
