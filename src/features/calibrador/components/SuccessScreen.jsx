import React from "react";
import { CheckCircle, ArrowRight, User } from "lucide-react";
const SuccessScreen = ({
  emoji,
  title,
  noteLabel,
  note,
  subtitle,
  onNext,
  nextLabel,
}) => (
  <div
    className="step-pane text-center"
    style={{
      animation: "fadeIn 0.4s ease",
    }}
  >
    <div
      style={{
        fontSize: "5rem",
        marginBottom: "1rem",
      }}
    >
      {emoji}
    </div>
    <h2
      style={{
        color: "#16a34a",
      }}
    >
      {title}
    </h2>
    <p
      style={{
        fontSize: "1.3rem",
        color: "#444",
      }}
    >
      {noteLabel}{" "}
      <strong
        style={{
          color: "var(--color-primary)",
          fontSize: "2rem",
        }}
      >
        {note?.name}
      </strong>
    </p>
    {subtitle && (
      <p
        style={{
          color: "#666",
          marginTop: "0.5rem",
        }}
      >
        {subtitle}
      </p>
    )}
    <button className="btn btn-primary mt-3" onClick={onNext}>
      {nextLabel} <ArrowRight size={18} />
    </button>
  </div>
);
export default SuccessScreen;
