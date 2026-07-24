import React, { useState, useEffect } from "react";
import { Mic, ArrowRight, Music2, Square, Play } from "lucide-react";
import SustainBar from "./SustainBar";
import useAveragePitch from "../hooks/useAveragePitch";
const HumStep = ({ title, desc, hum, savedNote, savedLabel }) => (
  <div className="step-pane text-center">
    <h2>{title}</h2>
    <p className="mb-4">{desc}</p>
    <div
      style={{
        background: "#fef9c3",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        marginBottom: "1rem",
        color: "#854d0e",
        fontSize: "0.85rem",
      }}
    >
      🎵 Cantarole <em>"la la la..."</em> continuamente. O app vai tirar a média de
      5 segundos!
    </div>
    <div
      className={`mic-button ${hum.isRecording ? "recording" : ""}`}
      onClick={hum.toggle}
    >
      <Music2 size={32} />
    </div>
    {hum.isRecording && (
      <div
        style={{
          marginTop: "1rem",
        }}
      >
        {hum.currentNote ? (
          <h1
            style={{
              color: "var(--color-primary)",
              fontSize: "3rem",
              margin: "0 0 0.25rem",
            }}
          >
            {hum.currentNote.name}
          </h1>
        ) : (
          <h1
            style={{
              color: "#ccc",
              fontSize: "3rem",
              margin: "0 0 0.25rem",
            }}
          >
            --
          </h1>
        )}
        <SustainBar
          progress={hum.progress}
          totalSeconds={5}
          label={
            hum.progress < 100
              ? `Coletando... ${Math.max(0, Math.ceil(((100 - hum.progress) / 100) * 5))}s · ${hum.samplesCount} amostras`
              : "✅ Calculando média..."
          }
        />
      </div>
    )}
    {!hum.isRecording && savedNote && (
      <p
        style={{
          color: "#666",
          marginTop: "1rem",
        }}
      >
        ✅ {savedLabel}:{" "}
        <strong
          style={{
            color: "var(--color-primary)",
          }}
        >
          {savedNote.name}
        </strong>
      </p>
    )}
    {!hum.isRecording && !savedNote && (
      <p
        style={{
          color: "#aaa",
          marginTop: "1rem",
          fontSize: "0.9rem",
        }}
      >
        Clique no botão para começar a gravar
      </p>
    )}
  </div>
);
export default HumStep;
