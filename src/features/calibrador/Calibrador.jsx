import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDAO from "../../api/UserDAO";
import "./Calibrador.css";

import {
  loadStorage,
  saveStorage,
  computeCombined,
  getGender,
  getVoiceClassification,
  getVoiceRange,
} from "./utils/calibradorUtils";
import ModeSelection from "./components/ModeSelection";
import HumStep from "./components/HumStep";
import MicStep from "./components/MicStep";
import AssistantStep from "./components/AssistantStep";
import useMicPitch from "./hooks/useMicPitch";
import useAveragePitch from "./hooks/useAveragePitch";
import VoiceClassifier from "../../domain/VoiceClassifier";
import * as Tone from "tone";

export default function Calibrador({ user }) {
  const navigate = useNavigate();
  const [storageData, setStorageData] = useState(loadStorage);
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [noteSaved, setNoteSaved] = useState(false);
  const [minNote, setMinNote] = useState(null);
  const [maxNote, setMaxNote] = useState(null);
  const [refazerModal, setRefazerModal] = useState(null);
  
  const [lowBuffer, setLowBuffer] = useState(null);
  const [highBuffer, setHighBuffer] = useState(null);

  const { calibrations } = storageData;

  const saveCalibration = async (modeKey, min, max) => {
    const newCals = {
      ...calibrations,
      [modeKey]: {
        min,
        max,
        completedAt: new Date().toISOString(),
      },
    };
    const combined = computeCombined(newCals);
    
    // Voice DSP analysis if available
    if (lowBuffer && highBuffer && modeKey !== "assistant") {
      try {
        const classifier = new VoiceClassifier(Tone.context.sampleRate || 44100);
        const dspResult = classifier.analyze(lowBuffer, highBuffer);
        if (dspResult && dspResult.classificacao !== "Indefinido") {
          combined.tipoVoz = dspResult.classificacao;
          combined.gender = getGender(dspResult.classificacao);
          combined.dspMetricas = dspResult.metricas;
        }
      } catch (e) {
        console.error("DSP Classifier error:", e);
      }
    }
    
    const newData = {
      calibrations: newCals,
      combined,
    };
    setStorageData(newData);
    saveStorage(newData);
    
    if (user && combined) {
      const email = typeof user === "string" ? user : user.email || user.uid;
      await UserDAO.saveProfile(email, combined, newData);
    }
  };

  const finishMode = (modeKey, min, max) => {
    saveCalibration(modeKey, min, max);
    setStep(99);
  };

  const mic = useMicPitch({
    step,
    onNoteConfirmed: (noteData, currentStep, buffer) => {
      if (currentStep === 2) {
        setMinNote(noteData);
        if (buffer) setLowBuffer(new Float32Array(buffer));
        setNoteSaved("grave");
      } else if (currentStep === 3) {
        setMaxNote(noteData);
        if (buffer) setHighBuffer(new Float32Array(buffer));
        setNoteSaved("agudo");
      }
    },
  });

  const hum = useAveragePitch({
    onDone: (noteData, count, buffer) => {
      if (step === 2) {
        setMinNote(noteData);
        if (buffer) setLowBuffer(new Float32Array(buffer));
        setNoteSaved("grave");
      } else if (step === 3) {
        setMaxNote(noteData);
        if (buffer) setHighBuffer(new Float32Array(buffer));
        setNoteSaved("agudo");
      }
    },
  });

  const startMode = (m) => {
    setMode(m);
    setStep(1);
    setNoteSaved(false);
    setMinNote(null);
    setMaxNote(null);
    setLowBuffer(null);
    setHighBuffer(null);
    setRefazerModal(null);
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const getRecommendation = () => {
    const done = Object.keys(calibrations);
    if (done.length === 0) return null;
    if (done.includes("assistant") && !done.includes("mic"))
      return { mode: "mic", msg: "Confirme com o microfone!" };
    if (done.includes("mic") && !done.includes("assistant"))
      return { mode: "assistant", msg: "Use o Assistente para comparar." };
    if (!done.includes("hum"))
      return { mode: "hum", msg: "Cantarole para uma validação rápida." };
    return null;
  };

  if (!mode) {
    return (
      <ModeSelection
        calibrations={calibrations}
        storageData={storageData}
        setStorageData={setStorageData}
        user={user}
        startMode={startMode}
        refazerModal={refazerModal}
        setRefazerModal={setRefazerModal}
        recommendation={getRecommendation()}
      />
    );
  }

  if (step === 99) {
    const cal = calibrations[mode];
    return (
      <div className="container calibrador-page">
        <div className="calibrador-card card text-center">
          <div className="icon-wrapper success mb-4" style={{ display: 'inline-flex', justifyContent: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22c55e' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Perfil Salvo!</h2>
          {cal && (
            <p style={{ fontSize: "1.1rem", color: "#444", marginBottom: "0.5rem" }}>
              <strong>{getVoiceClassification(cal.min?.freq, cal.max?.freq)}</strong>{" "}
              · {getVoiceRange(cal.min?.freq, cal.max?.freq)}
            </p>
          )}
          {Object.keys(calibrations).length > 1 && storageData.combined && (
            <p style={{ color: "#666", fontSize: "0.9rem" }}>
              Média de {Object.keys(calibrations).length} testes:{" "}
              {getVoiceRange(
                storageData.combined.min?.freq,
                storageData.combined.max?.freq,
              )}
            </p>
          )}
          <p className="mb-4" style={{ color: "#666" }}>
            A IA ajustará as cifras para você.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-outline"
              onClick={() => setMode(null)}
            >
              Fazer outro teste
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/")}>
              Voltar aos Cantos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container calibrador-page">
      <div className="calibrador-card card">
        <button
          onClick={() => {
            mic.stopRecording();
            hum.stopRecording();
            setMode(null);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#666",
            fontSize: "0.85rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          ← Voltar à seleção
        </button>
        {mode !== "assistant" && (
          <div className="steps-indicator">
            {[1, 2, 3, 4].map((s, i, arr) => (
              <React.Fragment key={s}>
                <div className={`step-dot ${step >= s ? "active" : ""}`} />
                {i < arr.length - 1 && <div className="step-line" />}
              </React.Fragment>
            ))}
          </div>
        )}
        
        <div className="calibrador-content">
          {mode === "assistant" && (
            <AssistantStep 
               onFinish={(modeKey, min, max) => finishMode(modeKey, min, max)} 
            />
          )}

          {mode !== "assistant" && (
            <>
              {step === 1 && (
                <div className="step-pane text-center">
                  <h2>Vamos descobrir sua voz!</h2>
                  <p className="mb-4">Serão duas etapas simples:</p>
                  <div className="mb-4" style={{ textAlign: "left", display: "inline-block" }}>
                    <p>
                      <strong>1. Som Grave:</strong> Cante a nota mais grave (baixa)
                      que conseguir.
                    </p>
                    <p>
                      <strong>2. Som Agudo:</strong> Cante a nota mais aguda (alta)
                      sem forçar a garganta.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={handleNext}>
                    Estou pronto!
                  </button>
                </div>
              )}

              {step === 2 && (
                <>
                  {mode === "hum" ? (
                    <HumStep
                      title="Passo 1: Som Grave"
                      desc="Tente cantarolar a nota mais grave e profunda que você consegue manter."
                      hum={hum}
                      savedNote={minNote}
                      savedLabel="Grave captado"
                    />
                  ) : (
                    <MicStep
                      title="Passo 1: Som Grave"
                      desc="Cante um 'Ahhh' na nota mais grave que conseguir."
                      mic={mic}
                      savedNote={minNote}
                      savedLabel="Grave captado"
                    />
                  )}
                  {noteSaved === "grave" && (
                    <button
                      className="btn btn-primary"
                      style={{ animation: "fadeIn 0.3s ease", marginTop: "2rem" }}
                      onClick={handleNext}
                    >
                      Avançar para o Agudo →
                    </button>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  {mode === "hum" ? (
                    <HumStep
                      title="Passo 2: Som Agudo"
                      desc="Agora cantarole a nota mais aguda (fininha) que você consegue sem se machucar."
                      hum={hum}
                      savedNote={maxNote}
                      savedLabel="Agudo captado"
                    />
                  ) : (
                    <MicStep
                      title="Passo 2: Som Agudo"
                      desc="Cante um 'Ahhh' na nota mais aguda possível."
                      mic={mic}
                      savedNote={maxNote}
                      savedLabel="Agudo captado"
                    />
                  )}
                  {noteSaved === "agudo" && (
                    <button
                      className="btn btn-primary"
                      style={{ animation: "fadeIn 0.3s ease", background: "#16a34a", marginTop: "2rem" }}
                      onClick={handleNext}
                    >
                      Ver meu resultado ✨
                    </button>
                  )}
                </>
              )}

              {step === 4 && (
                <div className="step-pane text-center" style={{ animation: "fadeIn 0.4s ease" }}>
                  <h2>Tudo Pronto!</h2>
                  <p className="mb-4">
                    Já temos suas medidas.
                    <br />
                    Grave: <strong>{minNote?.name}</strong> | Agudo:{" "}
                    <strong>{maxNote?.name}</strong>
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: "1.2rem", padding: "1rem 2rem", background: "#16a34a" }}
                    onClick={() => finishMode(mode, minNote, maxNote)}
                  >
                    Salvar e Ver Perfil 🎤
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
