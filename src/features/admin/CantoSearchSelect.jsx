import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cantosData } from "../../data";
const colorMap = {
  verde: "#dcfce7",
  amarelo: "#fef9c3",
  azul: "#e0f2fe",
  branco: "#ffffff",
};
export function CantoSearchSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  const allCantos = Object.keys(cantosData).map((key) => ({
    id: key,
    titulo: cantosData[key].titulo,
    cor: cantosData[key].cor || "branco",
  }));
  const filteredCantos = allCantos.filter((canto) =>
    canto.titulo.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const selectedCanto = allCantos.find((c) => c.id === value);
  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: selectedCanto ? colorMap[selectedCanto.cor] : "#fff",
          cursor: "pointer",
          minHeight: "44px",
        }}
      >
        <span
          style={{
            color: selectedCanto ? "#333" : "#666",
            fontWeight: selectedCanto ? "bold" : "normal",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedCanto ? selectedCanto.titulo : "-- Buscar Canto --"}
        </span>
        <ChevronDown
          size={18}
          color="#666"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "0.2s",
          }}
        />
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: "300px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Search size={16} color="#999" />
            <input
              autoFocus={true}
              type="text"
              placeholder="Digite o nome do canto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: "0.9rem",
              }}
            />
          </div>
          <div
            style={{
              overflowY: "auto",
              flex: 1,
            }}
          >
            {filteredCantos.length === 0 ? (
              <div
                style={{
                  padding: "12px",
                  color: "#999",
                  textAlign: "center",
                  fontSize: "0.9rem",
                }}
              >
                Nenhum canto encontrado.
              </div>
            ) : (
              filteredCantos.map((canto) => (
                <div
                  onClick={() => {
                    onChange(canto.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    backgroundColor: colorMap[canto.cor] || "#fff",
                    borderBottom: "1px solid rgba(0,0,0,0.03)",
                    fontSize: "0.95rem",
                    fontWeight: value === canto.id ? "bold" : "normal",
                    color: "#333",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.filter = "brightness(0.95)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.filter = "brightness(1)")
                  }
                >
                  {canto.titulo}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
