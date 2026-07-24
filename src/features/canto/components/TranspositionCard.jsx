import React from "react";
import { Settings2, ThumbsUp, Info, Lightbulb, Save } from "lucide-react";
import { otimizarCapoETom } from "../../../domain/capoEngine";
import capoIcon from "../../../assets/capotraste.png";
import "./TranspositionCard.css";
export const TranspositionCard = ({
  transposition,
  setTransposition,
  capoInfo,
  baseOffset,
  initialTransposition,
  canto,
  aplicarTomInteligente,
  user,
  salvarTomPreferido,
  isToneSaved,
  setShowSobreModal,
  tomEsforco,
  setTomEsforco,
  aiData,
}) => {
  const renderAssembleia = () => {
    if (
      tomEsforco === null ||
      tomEsforco === undefined ||
      canto.tom_original === "?"
    )
      return null;
    const assCapo = otimizarCapoETom(canto.tom_original, tomEsforco);
    return (
      <div
        className="instruction-block"
        onClick={() => setShowSobreModal("assembly")}
        style={{
          cursor: "pointer",
        }}
      >
        <div
          className="instruction-label"
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: "0.2rem",
            marginBottom: "0.5rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            🗣️ Assembleia{" "}
            <Info
              size={14}
              style={{
                opacity: 0.5,
              }}
            />
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "normal" }}>
            Sugestão para os irmãos
          </span>
        </div>
        <div className="badges-row">
          <span className="badge-inst badge-inst-assembly-chord">
            🎸 Toque {assCapo.formaAcorde}
          </span>
          {assCapo.capoCasa > 0 && (
            <span className="badge-inst badge-inst-assembly-capo">
              <img
                src={capoIcon}
                alt="Capo"
                style={{
                  width: "14px",
                  height: "14px",
                  filter:
                    "grayscale(100%) brightness(0.4) sepia(1) hue-rotate(300deg) saturate(300%)",
                }}
              />
              Capo {assCapo.capoCasa}ª
            </span>
          )}
        </div>
      </div>
    );
  };
  const showPlayerInst = capoInfo.formaAcorde !== "?";
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Card 1: Transposição Principal */}
      <div className="transpo-card-wrapper">
        <div className="transpo-header">Transposição</div>

        <div className="transpo-controls-container" style={{ padding: "1.5rem 1rem", background: "var(--color-bg-subtle)", borderRadius: "16px", marginBottom: "1.5rem", border: "1px solid var(--color-border)" }}>
        <div className="transpo-controls" style={{ gap: "1rem", justifyContent: "space-between", width: "100%", maxWidth: "300px", margin: "0 auto" }}>
          <button
            className="btn-transpo"
            onClick={() => setTransposition((t) => t - 1)}
          >
            -
          </button>
          
          <div 
            className="transpo-main-info" 
            onClick={() => setShowSobreModal("psalmist")}
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: "0.25rem",
              minWidth: "150px",
              cursor: "pointer"
            }}
            title="Mais detalhes sobre o tom"
          >
            <span style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-primary)", display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
              🎸 {capoInfo.formaAcorde}
            </span>
            {capoInfo.capoCasa > 0 ? (
              <span style={{ fontSize: "1rem", color: "var(--color-text-main)", fontWeight: "500", display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fef3c7', padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#92400e' }}>
                 <img src={capoIcon} alt="Capo" style={{ width: "14px", height: "14px", filter: 'grayscale(100%) brightness(0.4) sepia(1) hue-rotate(300deg) saturate(300%)' }} />
                 Capo {capoInfo.capoCasa}ª
              </span>
            ) : (
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                 Sem capo
              </span>
            )}
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem", display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Info size={12} /> Detalhes
            </span>
          </div>

          <button
            className="btn-transpo"
            onClick={() => setTransposition((t) => t + 1)}
          >
            +
          </button>
        </div>

        </div>

        <div className="transpo-actions">
          <div className="action-row">
            <button
              className="btn-action btn-recalibrate"
              onClick={aplicarTomInteligente}
            >
              <Settings2
                size={16}
                style={{
                  marginRight: "0.4rem",
                }}
              />{" "}
              Recalibrar
            </button>
            {user && (
              <button
                className={`btn-action btn-favorite ${isToneSaved ? "saved" : ""}`}
                onClick={salvarTomPreferido}
                disabled={isToneSaved}
              >
                <Save
                  size={16}
                  fill={isToneSaved ? "currentColor" : "none"}
                  style={{
                    marginRight: "0.4rem",
                  }}
                />{" "}
                {isToneSaved ? "Tom Salvo" : "Salvar Tom"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Assembleia */}
      <div className="transpo-card-wrapper" style={{ padding: "1.5rem 1rem", justifyContent: "center" }}>
        <div className="transpo-instructions" style={{ marginBottom: 0 }}>
          {renderAssembleia()}
        </div>
      </div>
    </div>
  );
};
