import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  MODE_INFO,
  getVoiceRange,
  getVoiceClassification,
  computeCombined,
  saveStorage,
} from "../utils/calibradorUtils";
import UserDAO from "../../../api/UserDAO";

export default function ModeSelection({
  calibrations,
  storageData,
  setStorageData,
  user,
  startMode,
  refazerModal,
  setRefazerModal,
  recommendation,
}) {
  const totalDone = Object.keys(calibrations).length;

  return (
    <div
      className="container calibrador-page"
      style={{ maxWidth: "680px" }}
    >
      {refazerModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "360px",
              width: "90%",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>Ajustar calibração?</h3>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              O que você deseja fazer com o teste de{" "}
              <strong>{MODE_INFO[refazerModal]?.label}</strong>?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                className="btn btn-primary"
                onClick={() => startMode(refazerModal)}
              >
                Refazer Teste ✓
              </button>
              <button
                className="btn btn-outline"
                style={{
                  borderColor: "var(--color-danger)",
                  color: "var(--color-danger)",
                }}
                onClick={() => {
                  const newCals = { ...calibrations };
                  delete newCals[refazerModal];
                  const combined = computeCombined(newCals);
                  const newData = { calibrations: newCals, combined };
                  setStorageData(newData);
                  saveStorage(newData);
                  if (user) {
                    const email =
                      typeof user === "string" ? user : user.email || user.uid;
                    UserDAO.saveProfile(email, combined, newData).catch(
                      console.error
                    );
                  }
                  setRefazerModal(null);
                }}
              >
                Remover Calibração
              </button>
              <button
                className="btn btn-outline"
                style={{ marginTop: "0.5rem" }}
                onClick={() => setRefazerModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="calibrador-card card text-center">
        <h2>Como você prefere calibrar sua voz?</h2>
        {totalDone > 0 && (
          <p
            style={{
              color: "#666",
              fontSize: "0.9rem",
              marginTop: "0.25rem",
            }}
          >
            {totalDone} teste{totalDone > 1 ? "s" : ""} concluído
            {totalDone > 1 ? "s" : ""} · Clique em um concluído para refazer
          </p>
        )}
        <div className="mode-selection mt-4">
          {Object.entries(MODE_INFO).map(([key, info]) => {
            const done = calibrations[key];
            const Icon = info.icon;
            if (done) {
              const range = getVoiceRange(done.min?.freq, done.max?.freq);
              const vtype = getVoiceClassification(done.min?.freq, done.max?.freq);
              return (
                <button
                  key={key}
                  onClick={() => setRefazerModal(key)}
                  style={{
                    flexDirection: "column",
                    padding: "1.5rem 1rem",
                    background: "var(--color-bg-secondary)",
                    border: "2px solid var(--color-secondary)",
                    borderRadius: "12px",
                    color: "var(--color-text-main)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                    boxShadow: "var(--shadow-md)",
                    transition: "transform 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(31, 60, 109, 0.1)",
                      borderRadius: "50%",
                      padding: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <Icon size={36} color="var(--color-secondary)" />
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "var(--color-secondary)",
                    }}
                  >
                    ✓ Concluído
                  </span>
                  <strong
                    style={{
                      fontSize: "1.2rem",
                      marginTop: "0.25rem",
                      display: "block",
                      color: "var(--color-primary)",
                    }}
                  >
                    {info.label}
                    {info.suffix && (
                      <span
                        style={{
                          fontSize: "0.75em",
                          fontWeight: "normal",
                          opacity: 0.9,
                          marginLeft: "4px",
                        }}
                      >
                        {" "}{info.suffix}
                      </span>
                    )}
                  </strong>
                  <span
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      color: "var(--color-secondary)",
                      marginTop: "0.35rem",
                    }}
                  >
                    {vtype}
                  </span>
                  {range && (
                    <span
                      style={{
                        fontSize: "0.9rem",
                        color: "#444",
                        marginTop: "0.2rem",
                      }}
                    >
                      🎵 {range}
                    </span>
                  )}
                </button>
              );
            }
            return (
              <button
                key={key}
                className="btn btn-outline"
                style={{
                  flexDirection: "column",
                  padding: "1.5rem 1rem",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => startMode(key)}
              >
                <Icon
                  size={56}
                  className="mb-2"
                  style={{ color: info.color }}
                />
                <strong style={{ fontSize: "1.05rem" }}>
                  {info.label}
                  {info.suffix && (
                    <span
                      style={{
                        fontSize: "0.75em",
                        fontWeight: "normal",
                        opacity: 0.9,
                        marginLeft: "4px",
                      }}
                    >
                      {" "}{info.suffix}
                    </span>
                  )}
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: "0.4rem",
                    color: "#666",
                    fontSize: "0.9rem",
                  }}
                >
                  {info.desc}
                </span>
              </button>
            );
          })}
        </div>
        {recommendation && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "#fef9c3",
              borderRadius: "10px",
              border: "1px solid #fde047",
              color: "#854d0e",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>💡</span>
            <div>
              <strong>Sugestão:</strong> {recommendation.msg}
              <button
                className="btn btn-sm btn-outline"
                style={{
                  marginLeft: "0.75rem",
                  borderColor: "#854d0e",
                  color: "#854d0e",
                }}
                onClick={() => startMode(recommendation.mode)}
              >
                Fazer agora
              </button>
            </div>
          </div>
        )}
        {storageData.combined && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "#f0fdf4",
              borderRadius: "10px",
              border: "1px solid #86efac",
              color: "#166534",
            }}
          >
            <strong>
              🎼 Perfil combinado ({Object.keys(calibrations).length} testes):
            </strong>
            <div
              style={{
                marginTop: "0.25rem",
                fontSize: "1.05rem",
              }}
            >
              {getVoiceClassification(
                storageData.combined.min?.freq,
                storageData.combined.max?.freq
              )}{" "}
              ·{" "}
              {getVoiceRange(
                storageData.combined.min?.freq,
                storageData.combined.max?.freq
              )}
            </div>
          </div>
        )}
        {totalDone > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <Link
              to="/"
              className="btn btn-primary"
              style={{
                width: "100%",
                maxWidth: "300px",
              }}
            >
              Ir para os cantos{" "}
              <ArrowRight
                size={18}
                style={{ marginLeft: "0.5rem" }}
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
