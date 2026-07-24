import React from "react";
import { Book } from "lucide-react";
export const NotepadSection = ({
  showNotes,
  setShowNotes,
  notes,
  setNotes,
  saveNotes,
}) => {
  return (
    <div className={`notepad-section mb-0 ${showNotes ? "expanded" : ""}`}>
      <div
        className={`card notepad-card-container ${showNotes ? "expanded" : ""}`}
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          transition: "all 0.3s ease",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#475569",
            cursor: "pointer",
          }}
          onClick={() => setShowNotes(!showNotes)}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Book size={18} color="#0ea5e9" />{" "}
            <strong
              style={{
                fontWeight: "600",
              }}
            >
              Anotações do Salmista
            </strong>
          </div>
          <div
            style={{
              position: "relative",
              width: "40px",
              height: "24px",
              backgroundColor: showNotes ? "#0ea5e9" : "#cbd5e1",
              borderRadius: "24px",
              transition: "0.3s",
              display: "flex",
              alignItems: "center",
              padding: "2px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "white",
                borderRadius: "50%",
                transition: "0.3s",
                transform: showNotes ? "translateX(16px)" : "translateX(0)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        </div>
        {showNotes && (
          <textarea
            className="notepad-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Escreva dicas, ritmos ou lembretes sobre este canto..."
            style={{
              width: "100%",
              minHeight: "80px",
              border: "none",
              background: "transparent",
              outline: "none",
              fontFamily: "var(--font-body)",
              resize: "none",
              marginTop: "1rem",
              borderTop: "1px dashed #e0d8b0",
              paddingTop: "1rem",
            }}
          />
        )}
      </div>
    </div>
  );
};
