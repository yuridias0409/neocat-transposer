import React, { useState } from "react";
import AdminPitchMapperTab from "./AdminPitchMapperTab";
import AdminMLDashboardTab from "./AdminMLDashboardTab";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pitch");

  return (
    <div
      className="container"
      style={{
        padding: "2rem",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2>Área Administrativa 🛡️</h2>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          className={`btn ${activeTab === "pitch" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("pitch")}
        >
          🎛️ Mapeador de Frequências (Pitch)
        </button>
        <button
          className={`btn ${activeTab === "ml" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("ml")}
        >
          📊 ML & Feedbacks
        </button>
      </div>

      {activeTab === "pitch" && <AdminPitchMapperTab />}
      {activeTab === "ml" && <AdminMLDashboardTab />}
    </div>
  );
}
