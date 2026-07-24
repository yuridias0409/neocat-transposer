import React, { useState, useEffect } from "react";
import { Mic, ArrowRight, Music2, Square, Play } from "lucide-react";
import SustainBar from "./SustainBar";
import useMicPitch from "../hooks/useMicPitch";
const MicStep = ({ title, desc, mic, savedNote, savedLabel }) => (
  <div className="step-pane text-center">
    <h2>{title}</h2>
    <p className="mb-4">{desc}</p>
    <div
      className={`mic-button ${mic.isRecording ? "recording" : ""}`}
      onClick={mic.toggle}
    >
      <Mic size={32} />
    </div>
    <div
      className="live-note-display mt-3"
      style={{
        minHeight: "120px",
      }}
    >
      {mic.currentNote ? (
        <h1
          style={{
            color: "var(--color-primary)",
            fontSize: "3rem",
            margin: 0,
          }}
        >
          {mic.currentNote.name}
        </h1>
      ) : (
        <h1
          style={{
            color: "#ccc",
            fontSize: "3rem",
            margin: 0,
          }}
        >
          --
        </h1>
      )}
      <div
        style={{
          opacity: mic.isRecording && mic.currentNote ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
        }}
      >
        <SustainBar progress={mic.sustainProgress} />
      </div>
      {savedNote && !mic.isRecording && (
        <p
          style={{
            color: "#666",
            marginTop: "0.5rem",
          }}
        >
          ✅ {savedLabel}: <strong>{savedNote.name}</strong>
        </p>
      )}
    </div>
  </div>
);
export default MicStep;
