import React from "react";
const SustainBar = ({ progress, totalSeconds = 3, label }) => (
  <div
    style={{
      margin: "0.75rem auto",
      maxWidth: "220px",
    }}
  >
    <div
      style={{
        background: "#e5e7eb",
        borderRadius: "99px",
        height: "10px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: "99px",
          width: `${progress}%`,
          background: progress >= 100 ? "#16a34a" : "var(--color-primary)",
          transition: "width 0.05s linear",
        }}
      />
    </div>
    <small
      style={{
        color: "#666",
        display: "block",
        marginTop: "0.3rem",
      }}
    >
      {label ||
        `Segure... ${Math.max(0, Math.ceil(((100 - progress) / 100) * totalSeconds))}s`}
    </small>
  </div>
);
export default SustainBar;
