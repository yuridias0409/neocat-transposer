import React from "react";
import { otimizarCapoETom } from "../../../domain/capoEngine";
import capoIcon from "../../../assets/capotraste.png";

export const CantoHeader = ({
  canto,
  savedTransposition,
  initialTransposition,
}) => {
  let badgeOffset =
    savedTransposition !== null && savedTransposition !== undefined
      ? savedTransposition
      : initialTransposition;
  let hasSavedTone =
    savedTransposition !== null && savedTransposition !== undefined;

  return (
    <div className="canto-header mb-4">
      <div
        className="canto-title-block"
        style={{
          width: "100%",
        }}
      >
        <h1
          style={{
            marginBottom: "0.5rem",
          }}
        >
          {canto.titulo}
        </h1>
        <div
          className="canto-meta-info"
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="badge badge-primary">
            Tom Original: {canto.tom_original}
          </span>
          {badgeOffset !== undefined &&
          badgeOffset !== null &&
          canto.tom_original !== "?" ? (
            (() => {
              const badgeCapo = otimizarCapoETom(
                canto.tom_original,
                badgeOffset,
              );
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginLeft: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      color: hasSavedTone ? "#15803d" : "#ca8a04",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      marginRight: "4px",
                    }}
                  >
                    {hasSavedTone ? "✅ Seu Tom:" : "Sugerido:"}
                  </span>
                  <span
                    style={{
                      background: hasSavedTone ? "#dcfce7" : "#e0f2fe",
                      color: hasSavedTone ? "#166534" : "#0369a1",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                    }}
                  >
                    🎸 {badgeCapo.formaAcorde}
                  </span>
                  {badgeCapo.capoCasa > 0 && (
                    <span
                      style={{
                        background: hasSavedTone ? "#dcfce7" : "#fef3c7",
                        color: hasSavedTone ? "#166534" : "#b45309",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <img
                        src={capoIcon}
                        alt="Capo"
                        style={{
                          width: "14px",
                          height: "14px",
                          filter: hasSavedTone
                            ? "none"
                            : "hue-rotate(20deg) saturate(150%) brightness(0.8)",
                        }}
                      />
                      {`Capo ${badgeCapo.capoCasa}ª`}
                    </span>
                  )}
                </div>
              );
            })()
          ) : null}
        </div>
      </div>
    </div>
  );
};
