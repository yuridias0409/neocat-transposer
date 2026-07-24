import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic,
  CheckCircle,
  ArrowRight,
  Guitar,
  ThumbsUp,
  ThumbsDown,
  User,
  Play,
  Square,
  UserPlus,
  Music2,
  X,
} from "lucide-react";
import { getVoiceClassification } from "../../domain/musicMath";
import VoiceClassifier from "../../domain/VoiceClassifier";
import { PitchDetector } from "pitchy";
import * as Tone from "tone";
import UserDAO from "../../api/UserDAO";
import useMicPitch from "./hooks/useMicPitch";
import useAveragePitch from "./hooks/useAveragePitch";
import "./Calibrador.css";
import {
  loadStorage,
  saveStorage,
  computeCombined,
  getGender,
  baseFreqs,
  MODE_INFO,
  getVoiceRange,
} from "./utils/calibradorUtils";
import SustainBar from "./components/SustainBar";
import HumStep from "./components/HumStep";
import MicStep from "./components/MicStep";
import SuccessScreen from "./components/SuccessScreen";
export default function Calibrador({ user }) {
  const navigate = useNavigate();
  const [storageData, setStorageData] = useState(loadStorage);
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [noteSaved, setNoteSaved] = useState(false);
  const [minNote, setMinNote] = useState(null);
  const [maxNote, setMaxNote] = useState(null);
  const [empCapo, setEmpCapo] = useState(0);
  const [refazerModal, setRefazerModal] = useState(null);
  const [lowBuffer, setLowBuffer] = useState(null);
  const [highBuffer, setHighBuffer] = useState(null);
  const [assistantGender, setAssistantGender] = useState(null);
  const [astOffsetGrave, setAstOffsetGrave] = useState(0);
  const [astOffsetAgudo, setAstOffsetAgudo] = useState(0);
  const [astPlaying, setAstPlaying] = useState(false);
  const [showFeedbackAst, setShowFeedbackAst] = useState(false);
  const astPlayerRef = useRef(null);
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
    if (lowBuffer && highBuffer && modeKey !== "assistant") {
      try {
        const classifier = new VoiceClassifier(
          Tone.context.sampleRate || 44100,
        );
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
    setEmpCapo(0);
    setAssistantGender(null);
    setAstOffsetGrave(0);
    setAstOffsetAgudo(0);
    setRefazerModal(null);
  };
  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };
  const handleEmpiricalGrave = (ok) => {
    if (!ok) {
      setEmpCapo((c) => c + 1);
      return;
    }
    setMinNote({
      name: "E2 (Aprox)",
      freq: baseFreqs["E2"] * Math.pow(2, empCapo / 12),
    });
    setStep(3);
    setEmpCapo(0);
  };
  const handleEmpiricalAgudo = (ok) => {
    if (!ok) {
      setEmpCapo((c) => c - 1);
      return;
    }
    const max = {
      name: "G4 (Aprox)",
      freq: baseFreqs["G4"] * Math.pow(2, empCapo / 12),
    };
    setMaxNote(max);
    finishMode(
      "empirical",
      minNote || {
        name: "E2",
        freq: 82,
      },
      max,
    );
  };
  const stopAstAudio = () => {
    if (astPlayerRef.current) {
      astPlayerRef.current.stop();
      astPlayerRef.current.dispose();
      astPlayerRef.current = null;
    }
    setAstPlaying(false);
  };
  const playAstAudio = async (songId, offset) => {
    stopAstAudio();
    await Tone.start();
    astPlayerRef.current = new Tone.Player({
      url: `/calibrador/${songId}_${offset}.mp3`,
      autostart: true,
      onload: () => setAstPlaying(true),
      onstop: () => setAstPlaying(false),
    }).toDestination();
  };
  const toggleAstAudio = (songId, offset) =>
    astPlaying ? stopAstAudio() : playAstAudio(songId, offset);
  const handleAstGender = (gender) => {
    setAssistantGender(gender);
    setStep(1.5);
  };
  const handleAstRange = (rangeType) => {
    if (assistantGender === "male") {
      if (rangeType === "high") {
        setAstOffsetGrave(-1);
        setAstOffsetAgudo(3);
      }
      if (rangeType === "normal") {
        setAstOffsetGrave(-3);
        setAstOffsetAgudo(0);
      }
      if (rangeType === "low") {
        setAstOffsetGrave(-5);
        setAstOffsetAgudo(-2);
      }
    } else {
      if (rangeType === "high") {
        setAstOffsetGrave(2);
        setAstOffsetAgudo(8);
      }
      if (rangeType === "normal") {
        setAstOffsetGrave(0);
        setAstOffsetAgudo(5);
      }
      if (rangeType === "low") {
        setAstOffsetGrave(-2);
        setAstOffsetAgudo(3);
      }
    }
    setStep(2);
  };
  const astGraveSim = () => {
    setShowFeedbackAst(true);
    setTimeout(() => {
      setShowFeedbackAst(false);
      if (astOffsetGrave > -10) {
        setAstOffsetGrave((p) => p - 1);
        stopAstAudio();
        playAstAudio("769", astOffsetGrave - 1);
      } else {
        stopAstAudio();
        setStep(3);
      }
    }, 800);
  };
  const astGraveNao = () => {
    stopAstAudio();
    setStep(3);
  };
  const astAgudoSim = () => {
    setShowFeedbackAst(true);
    setTimeout(() => {
      setShowFeedbackAst(false);
      if (astOffsetAgudo < 8) {
        setAstOffsetAgudo((p) => p + 1);
        stopAstAudio();
        playAstAudio("824", astOffsetAgudo + 1);
      } else {
        stopAstAudio();
        astFinish();
      }
    }, 800);
  };
  const astAgudoNao = () => {
    stopAstAudio();
    astFinish();
  };
  const astFinish = () => {
    const minF = 82.41 * Math.pow(2, astOffsetGrave / 12);
    const maxF = 392.0 * Math.pow(2, astOffsetAgudo / 12);
    const min = {
      name: freqToNoteName(minF),
      freq: minF,
    };
    const max = {
      name: freqToNoteName(maxF),
      freq: maxF,
    };
    finishMode("assistant", min, max);
  };
  const getRecommendation = () => {
    const done = Object.keys(calibrations);
    if (done.length === 0) return null;
    if (done.includes("assistant") && !done.includes("mic"))
      return {
        mode: "mic",
        msg: "Confirme com o microfone!",
      };
    if (done.includes("mic") && !done.includes("assistant"))
      return {
        mode: "assistant",
        msg: "Use o Assistente para comparar.",
      };
    if (!done.includes("hum"))
      return {
        mode: "hum",
        msg: "Cantarole para uma validação rápida.",
      };
    return null;
  };
  const recommendation = getRecommendation();
  if (!mode) {
    const totalDone = Object.keys(calibrations).length;
    return (
      <div
        className="container calibrador-page"
        style={{
          maxWidth: "680px",
        }}
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
              <h3
                style={{
                  marginBottom: "0.5rem",
                }}
              >
                Ajustar calibração?
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1.5rem",
                }}
              >
                O que você deseja fazer com o teste de{" "}
                <strong>{MODE_INFO[refazerModal]?.label}</strong>?
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
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
                    const newCals = {
                      ...calibrations,
                    };
                    delete newCals[refazerModal];
                    const combined = computeCombined(newCals);
                    const newData = {
                      calibrations: newCals,
                      combined,
                    };
                    setStorageData(newData);
                    saveStorage(newData);
                    if (user) {
                      const email =
                        typeof user === "string"
                          ? user
                          : user.email || user.uid;
                      UserDAO.saveProfile(email, combined, newData).catch(
                        console.error,
                      );
                    }
                    setRefazerModal(null);
                  }}
                >
                  Remover Calibração
                </button>
                <button
                  className="btn btn-outline"
                  style={{
                    marginTop: "0.5rem",
                  }}
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
                const vtype = getVoiceClassification(
                  done.min?.freq,
                  done.max?.freq,
                );
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
                        />
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
                    style={{
                      color: info.color,
                    }}
                  />
                  <strong
                    style={{
                      fontSize: "1.05rem",
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
                      />
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
              <span
                style={{
                  fontSize: "1.5rem",
                }}
              >
                💡
              </span>
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
                  storageData.combined.max?.freq,
                )}{" "}
                ·{" "}
                {getVoiceRange(
                  storageData.combined.min?.freq,
                  storageData.combined.max?.freq,
                )}
              </div>
            </div>
          )}
          {totalDone > 0 && (
            <div
              style={{
                marginTop: "1.5rem",
              }}
            >
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
                  style={{
                    marginLeft: "0.5rem",
                  }}
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (step === 99) {
    const cal = calibrations[mode];
    return (
      <div className="container calibrador-page">
        <div className="calibrador-card card text-center">
          <div className="icon-wrapper success mb-4">
            <CheckCircle size={64} />
          </div>
          <h2>Perfil Salvo!</h2>
          {cal && (
            <p
              style={{
                fontSize: "1.1rem",
                color: "#444",
                marginBottom: "0.5rem",
              }}
            >
              <strong>
                {getVoiceClassification(cal.min?.freq, cal.max?.freq)}
              </strong>{" "}
              · {getVoiceRange(cal.min?.freq, cal.max?.freq)}
            </p>
          )}
          {Object.keys(calibrations).length > 1 && storageData.combined && (
            <p
              style={{
                color: "#666",
                fontSize: "0.9rem",
              }}
            >
              Média de {Object.keys(calibrations).length} testes:{" "}
              {getVoiceRange(
                storageData.combined.min?.freq,
                storageData.combined.max?.freq,
              )}
            </p>
          )}
          <p
            className="mb-4"
            style={{
              color: "#666",
            }}
          >
            A IA ajustará as cifras para você.
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-outline"
              onClick={() => {
                setMode(null);
              }}
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
              <React.Fragment>
                <div className={`step-dot ${step >= s ? "active" : ""}`} />
                {i < arr.length - 1 && <div className="step-line" />}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="calibrador-content">
          {mode === "assistant" && step === 1 && (
            <div className="step-pane text-center">
              <h2>Assistente de medição de voz</h2>
              <p className="mb-4">Para começar, escolha uma dessas opções:</p>
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "2rem",
                }}
              >
                <button
                  className="btn btn-outline"
                  style={{
                    padding: "3.5rem 3rem",
                    flexDirection: "column",
                    flex: "1 1 220px",
                    maxWidth: "300px",
                  }}
                  onClick={() => handleAstGender("male")}
                >
                  <span
                    style={{
                      color: "#b91c1c",
                      fontSize: "1.2rem",
                      fontWeight: 500,
                    }}
                  >
                    Tenho voz de
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      color: "#b91c1c",
                      marginTop: "0.75rem",
                      fontSize: "2.2rem",
                    }}
                  >
                    HOMEM
                  </h2>
                </button>
                <button
                  className="btn btn-outline"
                  style={{
                    padding: "3.5rem 3rem",
                    flexDirection: "column",
                    flex: "1 1 220px",
                    maxWidth: "300px",
                  }}
                  onClick={() => handleAstGender("female")}
                >
                  <span
                    style={{
                      color: "#b91c1c",
                      fontSize: "1.2rem",
                      fontWeight: 500,
                    }}
                  >
                    Tenho voz de
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      color: "#b91c1c",
                      marginTop: "0.75rem",
                      fontSize: "2.2rem",
                    }}
                  >
                    MULHER
                  </h2>
                </button>
              </div>
            </div>
          )}
          {mode === "assistant" && step === 1.5 && (
            <div className="step-pane text-center">
              <h2>Assistente de medição de voz</h2>
              <p className="mb-4">Escolha a opção que melhor te descreve:</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                  maxWidth: "520px",
                  margin: "0 auto",
                }}
              >
                {[
                  {
                    key: "normal",
                    label:
                      "Nem mais aguda nem mais grave que a maioria / Não sei",
                  },
                  {
                    key: "high",
                    label: "Minha voz é mais aguda do que a maioria",
                  },
                  {
                    key: "low",
                    label: "Minha voz é mais grave do que a maioria",
                  },
                ].map((o) => (
                  <button
                    className="btn btn-outline"
                    style={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      padding: "1.25rem 1.5rem",
                      fontSize: "1.15rem",
                    }}
                    onClick={() => handleAstRange(o.key)}
                  >
                    <span
                      style={{
                        color: "#b91c1c",
                        fontWeight: 600,
                      }}
                    >
                      {o.label} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {mode === "assistant" && step === 2 && (
            <div className="step-pane text-center">
              <h2>Passo 2: vamos encontrar sua nota mais grave</h2>
              <p className="mb-4">
                Tente cantar a seguinte estrofe com o áudio de referência.
              </p>
              <div
                className="sheet-preview"
                style={{
                  background: "#f9f9f9",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  textAlign: "left",
                  maxWidth: "400px",
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "2px solid #ddd",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <strong
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Cante assim:
                  </strong>
                  <button
                    className="btn btn-primary"
                    style={{
                      padding: "0.5rem",
                    }}
                    onClick={() => toggleAstAudio("769", astOffsetGrave)}
                  >
                    {astPlaying ? <Square size={18} /> : <Play size={18} />}
                  </button>
                </div>
                <h4
                  style={{
                    color: "#b91c1c",
                    textAlign: "center",
                  }}
                >
                  IAHWEH, TU ÉS MEU DEUS
                </h4>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "1.1rem",
                    marginTop: "1.5rem",
                    lineHeight: 2,
                  }}
                >
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Mi-
                  </span>{" "}
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Si7
                  </span>
                  <br />
                  IAHWEH, TU ÉS MEU DEUS,
                  <br />
                  <br />{" "}
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Mi-
                  </span>
                  <br />
                  EU TE LOUVAREI.
                </div>
              </div>
              <div className="mt-4">
                <p
                  style={{
                    fontSize: "1.2rem",
                  }}
                >
                  Conseguiu cantar?
                </p>
                {showFeedbackAst ? (
                  <div
                    style={{
                      color: "green",
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                    }}
                  >
                    <CheckCircle
                      size={24}
                      style={{
                        verticalAlign: "text-bottom",
                        marginRight: "0.5rem",
                      }}
                    />
                    Excelente! Ajustando...
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      className="btn btn-outline"
                      style={{
                        borderColor: "green",
                        color: "green",
                      }}
                      onClick={astGraveSim}
                    >
                      Sim
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        borderColor: "#b91c1c",
                        color: "#b91c1c",
                      }}
                      onClick={astGraveNao}
                    >
                      Não, é muito grave
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {mode === "assistant" && step === 3 && (
            <div className="step-pane text-center">
              <h2>Passo 3: vamos encontrar sua nota mais aguda</h2>
              <p className="mb-4">
                Tente cantar a estrofe abaixo. Atenção: cante forte, mas sem
                gritar!
              </p>
              <div
                className="sheet-preview"
                style={{
                  background: "#f9f9f9",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  textAlign: "left",
                  maxWidth: "400px",
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "2px solid #ddd",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <strong
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Cante assim:
                  </strong>
                  <button
                    className="btn btn-primary"
                    style={{
                      padding: "0.5rem",
                    }}
                    onClick={() => toggleAstAudio("824", astOffsetAgudo)}
                  >
                    {astPlaying ? <Square size={18} /> : <Play size={18} />}
                  </button>
                </div>
                <h4
                  style={{
                    color: "#b91c1c",
                    textAlign: "center",
                  }}
                >
                  SE O SENHOR NÃO CONSTRÓI A CASA
                </h4>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "1.1rem",
                    marginTop: "1.5rem",
                    lineHeight: 2,
                  }}
                >
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Do
                  </span>{" "}
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    La-
                  </span>{" "}
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Fa
                  </span>
                  <br />
                  SE O SENHOR NÃO CONSTRÓI A CASA,
                  <br />
                  <br />{" "}
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    Mi
                  </span>{" "}
                  <span
                    style={{
                      color: "#b91c1c",
                    }}
                  >
                    La-
                  </span>
                  <br />
                  EM VÃO TRABALHAM OS CONSTRUTORES.
                </div>
              </div>
              <div className="mt-4">
                <p
                  style={{
                    fontSize: "1.2rem",
                  }}
                >
                  Conseguiu cantar?
                </p>
                {showFeedbackAst ? (
                  <div
                    style={{
                      color: "green",
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                    }}
                  >
                    <CheckCircle
                      size={24}
                      style={{
                        verticalAlign: "text-bottom",
                        marginRight: "0.5rem",
                      }}
                    />
                    Muito bom! Ajustando...
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      className="btn btn-outline"
                      style={{
                        borderColor: "green",
                        color: "green",
                      }}
                      onClick={astAgudoSim}
                    >
                      Sim
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        borderColor: "#b91c1c",
                        color: "#b91c1c",
                      }}
                      onClick={astAgudoNao}
                    >
                      Não, é muito agudo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {mode === "mic" && step === 1 && (
            <div className="step-pane text-center">
              <h2>Teste por Microfone</h2>
              <p className="mb-4">
                Vamos descobrir sua extensão vocal pelo microfone. Você vai
                cantar sua nota mais grave e depois a mais aguda.
              </p>
              <div
                style={{
                  background: "#fef9c3",
                  padding: "1rem",
                  borderRadius: "10px",
                  marginBottom: "1.5rem",
                  color: "#854d0e",
                  fontSize: "0.9rem",
                }}
              >
                💡 Dica: mantenha cada nota por <strong>3 segundos</strong> para
                que ela seja registrada.
              </div>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Começar <ArrowRight size={18} />
              </button>
            </div>
          )}
          {mode === "mic" && step === 2 && !noteSaved && (
            <MicStep
              title="Teste do Grave"
              desc="Cante a nota mais grave que consegue com conforto e mantenha por 3 segundos."
              mic={mic}
              savedNote={minNote}
              savedLabel="Nota Mais Grave Salva"
            />
          )}
          {mode === "mic" && step === 2 && noteSaved === "grave" && (
            <SuccessScreen
              emoji="✅"
              title="Nota Grave Salva!"
              noteLabel="Sua nota mais grave é"
              note={minNote}
              subtitle="Agora vamos para o agudo..."
              onNext={() => {
                setNoteSaved(false);
                setStep(3);
              }}
              nextLabel="Ir para o Agudo"
            />
          )}
          {mode === "mic" && step === 3 && !noteSaved && (
            <MicStep
              title="Teste do Agudo"
              desc="Agora cante a nota mais aguda que alcança sem esforço e mantenha por 3 segundos."
              mic={mic}
              savedNote={maxNote}
              savedLabel="Nota Mais Aguda Salva"
            />
          )}
          {mode === "mic" && step === 3 && noteSaved === "agudo" && (
            <SuccessScreen
              emoji="🎉"
              title="Nota Aguda Salva!"
              noteLabel="Sua nota mais aguda é"
              note={maxNote}
              subtitle="Calibração concluída!"
              onNext={() => {
                setNoteSaved(false);
                finishMode(mode, minNote, maxNote);
              }}
              nextLabel="Ver Resultado"
            />
          )}
          {mode === "hum" && step === 1 && (
            <div className="step-pane text-center">
              <h2>Cantarolar</h2>
              <p className="mb-4">
                Vamos captar seu alcance vocal pelo cantarolar. Você vai
                cantarolar (hmm...) grave e depois agudo.
              </p>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Começar <ArrowRight size={18} />
              </button>
            </div>
          )}
          {mode === "hum" && step === 2 && !noteSaved && (
            <HumStep
              title="Cantarole o Grave"
              desc="Cantarole (hmm...) a nota mais grave que você consegue com conforto."
              hum={hum}
              savedNote={minNote}
              savedLabel="Nota Grave de Cantarolar Salva"
            />
          )}
          {mode === "hum" && step === 2 && noteSaved === "grave" && (
            <SuccessScreen
              emoji="✅"
              title="Média Grave Registrada!"
              noteLabel="A média do cantarolar grave deu"
              note={minNote}
              subtitle="Prepare-se para o cantarolar agudo..."
              onNext={() => {
                setNoteSaved(false);
                setStep(3);
              }}
              nextLabel="Ir para o Agudo"
            />
          )}
          {mode === "hum" && step === 3 && !noteSaved && (
            <HumStep
              title="Cantarole o Agudo"
              desc="Agora cantarole (hmm...) a nota mais aguda que você alcança com conforto."
              hum={hum}
              savedNote={maxNote}
              savedLabel="Nota Aguda de Cantarolar Salva"
            />
          )}
          {mode === "hum" && step === 3 && noteSaved === "agudo" && (
            <SuccessScreen
              emoji="🎉"
              title="Média Aguda Registrada!"
              noteLabel="A média do cantarolar agudo deu"
              note={maxNote}
              subtitle="Calibração por cantarolar finalizada!"
              onNext={() => {
                setNoteSaved(false);
                finishMode(mode, minNote, maxNote);
              }}
              nextLabel="Ver Resultado"
            />
          )}
          {mode === "empirical" && step === 1 && (
            <div className="step-pane text-center">
              <h2>Bem-vindo ao Calibrador</h2>
              <p className="mb-4">
                Vamos descobrir a sua extensão vocal com o violão.
              </p>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Começar <ArrowRight size={18} />
              </button>
            </div>
          )}
          {mode === "empirical" && step === 2 && (
            <div className="step-pane text-center">
              <h2>Passo 2: Hora do Grave</h2>
              <p className="mb-4">
                Toque <strong>Lá Menor (Am)</strong>{" "}
                {empCapo === 0 ? (
                  <strong>sem capotraste</strong>
                ) : (
                  <span>
                    com capotraste na <strong>casa {empCapo}</strong>
                  </span>
                )}{" "}
                e cante bem grave.
              </p>
              <div
                style={{
                  padding: "1rem",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                <code>[Am] A voz do meu a[E]mado...</code>
              </div>
              <p>O afinador confirmou seu grave?</p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  marginTop: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-outline"
                  onClick={() => handleEmpiricalGrave(false)}
                >
                  <ThumbsDown size={18} /> Não, subir capo
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEmpiricalGrave(true)}
                >
                  <ThumbsUp size={18} /> Sim, cravei a nota!
                </button>
              </div>
            </div>
          )}
          {mode === "empirical" && step === 3 && (
            <div className="step-pane text-center">
              <h2>Passo 3: Hora do Agudo</h2>
              <p className="mb-4">
                Toque <strong>Dó Maior (C)</strong>{" "}
                {empCapo <= 0 ? (
                  <strong>sem capotraste</strong>
                ) : (
                  <span>
                    com capotraste na <strong>casa {empCapo}</strong>
                  </span>
                )}{" "}
                e tente alcançar o agudo.
              </p>
              <div
                style={{
                  padding: "1rem",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  fontFamily: "monospace",
                }}
              >
                <span
                  style={{
                    color: "var(--color-primary)",
                  }}
                >
                  Do
                </span>{" "}
                <span
                  style={{
                    color: "var(--color-primary)",
                  }}
                >
                  La-
                </span>{" "}
                <span
                  style={{
                    color: "var(--color-primary)",
                  }}
                >
                  Fa
                </span>
                <br />
                SE O SENHOR NÃO CONSTRÓI A CASA
              </div>
              <p>Conseguiu alcançar?</p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  marginTop: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-outline"
                  onClick={() => handleEmpiricalAgudo(false)}
                >
                  <ThumbsDown size={18} /> Não alcanço, baixar capo
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEmpiricalAgudo(true)}
                >
                  <ThumbsUp size={18} /> Sim, cravei a nota!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
