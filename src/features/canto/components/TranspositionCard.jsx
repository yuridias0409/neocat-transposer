import React from "react";
import { Settings2, ThumbsUp, Info, Lightbulb } from "lucide-react";
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
          }}
        >
          Assembleia{" "}
          <Info
            size={14}
            style={{
              marginLeft: "4px",
              opacity: 0.5,
            }}
          />
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
    <div className="transpo-card-wrapper">
      <div className="transpo-header">Transposição</div>

      <div className="transpo-controls-container">
        <div className="transpo-controls">
          <button
            className="btn-transpo"
            onClick={() => setTransposition((t) => t - 1)}
          >
            -
          </button>
          <span className="transpo-value">{capoInfo.tomReal}</span>
          <button
            className="btn-transpo"
            onClick={() => setTransposition((t) => t + 1)}
          >
            +
          </button>
        </div>
        <div className="transpo-subtitle">
          {transposition - baseOffset === 0
            ? "0"
            : transposition - baseOffset > 0
              ? `+${transposition - baseOffset}`
              : transposition - baseOffset}{" "}
          semitons
        </div>
      </div>

      <div className="transpo-instructions">
        {showPlayerInst && (
          <div
            className="instruction-block"
            onClick={() => setShowSobreModal("psalmist")}
            style={{
              cursor: "pointer",
            }}
          >
            <div
              className="instruction-label"
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              Você toca{" "}
              <Info
                size={14}
                style={{
                  marginLeft: "4px",
                  opacity: 0.5,
                }}
              />
            </div>
            <div className="badges-row">
              <span className="badge-inst badge-inst-chord">
                🎸 Toque {capoInfo.formaAcorde}
              </span>
              {capoInfo.capoCasa > 0 && (
                <span className="badge-inst badge-inst-capo">
                  <img
                    src={capoIcon}
                    alt="Capo"
                    style={{
                      width: "14px",
                      height: "14px",
                    }}
                  />
                  Capo {capoInfo.capoCasa}ª
                </span>
              )}
            </div>
          </div>
        )}
        {renderAssembleia()}
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
              <ThumbsUp
                size={16}
                fill={isToneSaved ? "currentColor" : "none"}
                style={{
                  marginRight: "0.4rem",
                }}
              />{" "}
              {isToneSaved ? "Favoritado" : "Favoritar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
