import React, { useState, useEffect } from "react";
import { cantosData } from "../../data";
import CantoDAO from "../../api/CantoDAO";

export default function AdminMLDashboardTab() {
  const [mlData, setMlData] = useState(null);
  
  useEffect(() => {
    async function loadMlData() {
      const data = await CantoDAO.getAllCantosMetadata();
      setMlData(data);
    }
    loadMlData();
  }, []);

  return (
    <div
      className="card mt-4"
      style={{
        padding: "2rem",
      }}
    >
      <h3
        style={{
          borderBottom: "2px solid var(--color-bg-secondary)",
          paddingBottom: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        📊 Dashboard de Machine Learning (Feedbacks Globais)
      </h3>
      {mlData ? (
        Object.entries(mlData).filter(([_, data]) => data.metricas_feedback)
          .length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {Object.entries(mlData)
              .filter(([_, data]) => data.metricas_feedback)
              .map(([id, data]) => {
                const m = data.metricas_feedback;
                const c = cantosData[id];
                return (
                  <div
                    key={id}
                    style={{
                      padding: "1rem",
                      background: "var(--color-bg-secondary)",
                      borderRadius: "8px",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "var(--color-secondary)",
                      }}
                    >
                      {c?.titulo || id}
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "wrap",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span
                        style={{
                          background: "#fff",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Total:</strong> {m.total_avaliacoes}
                      </span>
                      <span
                        style={{
                          background: "#e6f4ea",
                          color: "#166534",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Ótimo:</strong> {m.qtd_otimo || 0}
                      </span>
                      <span
                        style={{
                          background: "#fef2f2",
                          color: "#991b1b",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Alto Demais:</strong> {m.qtd_alto_demais || 0}
                      </span>
                      <span
                        style={{
                          background: "#fef2f2",
                          color: "#991b1b",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Baixo Demais:</strong>{" "}
                        {m.qtd_baixo_demais || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p
            style={{
              color: "#666",
            }}
          >
            Ainda não há feedbacks de Machine Learning coletados para nenhum
            canto.
          </p>
        )
      ) : (
        <p
          style={{
            color: "#666",
          }}
        >
          Carregando dados de aprendizado...
        </p>
      )}
    </div>
  );
}
