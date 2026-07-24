import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { freqToNoteName } from "../utils/calibradorUtils";
import useMicPitch from "../hooks/useMicPitch";
import SustainBar from "./SustainBar";
import { User, Play, Square, ThumbsUp, ThumbsDown } from "lucide-react";

const AssistantStep = ({ onFinish, onCancel }) => {
  const [step, setStep] = useState(1);
  const [assistantGender, setAssistantGender] = useState(null);
  const [astOffsetGrave, setAstOffsetGrave] = useState(0);
  const [astOffsetAgudo, setAstOffsetAgudo] = useState(0);
  const [astPlaying, setAstPlaying] = useState(false);
  const [showFeedbackAst, setShowFeedbackAst] = useState(false);
  
  // Microphone capturing data for intelligent discrepancy analysis
  const [capturedGraveSamples, setCapturedGraveSamples] = useState([]);
  const [capturedAgudoSamples, setCapturedAgudoSamples] = useState([]);

  const astPlayerRef = useRef(null);
  const [audioProgress, setAudioProgress] = useState(0);

  const mic = useMicPitch({
    step,
    onNoteConfirmed: () => {}, // We don't want to stop the flow automatically
  });

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
      onload: () => {
        setAstPlaying(true);
      },
      onstop: () => {
        setAstPlaying(false);
      },
    }).toDestination();
  };

  const toggleAstAudio = (songId, offset) =>
    astPlaying ? stopAstAudio() : playAstAudio(songId, offset);

  // Ativa o microfone globalmente nos passos 2 e 3 para o usuário poder testar
  useEffect(() => {
    if (step === 2 || step === 3) {
      mic.startRecording();
    } else {
      mic.stopRecording();
    }
    return () => mic.stopRecording();
  }, [step]);

  // Monitor microphone during playback for the AI calculation
  useEffect(() => {
    if (astPlaying && mic.currentNote) {
      if (step === 2) {
        setCapturedGraveSamples(prev => [...prev, mic.currentNote.freq]);
      } else if (step === 3) {
        setCapturedAgudoSamples(prev => [...prev, mic.currentNote.freq]);
      }
    }
  }, [mic.currentNote, step, astPlaying]);

  useEffect(() => {
    let interval;
    if (astPlaying) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setAudioProgress(Math.min(100, (elapsed / 5000) * 100));
      }, 50);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(interval);
  }, [astPlaying]);

  useEffect(() => {
    return () => {
      stopAstAudio();
    };
  }, []);

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

  const getMinFreq = (samples) => {
    if (!samples || samples.length === 0) return null;
    const valid = samples.filter(f => f > 50 && f < 1000);
    if (valid.length === 0) return null;
    // Pega o 5º percentil para evitar outliers (ruídos muitos graves)
    const sorted = [...valid].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.05)];
  };

  const getMaxFreq = (samples) => {
    if (!samples || samples.length === 0) return null;
    const valid = samples.filter(f => f > 50 && f < 1000);
    if (valid.length === 0) return null;
    // Pega o 95º percentil para evitar outliers (ruídos muitos agudos)
    const sorted = [...valid].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)];
  };

  const astFinish = () => {
    // Alvos matemáticos do sistema (A nota mais grave da música 769 e a mais aguda da 824)
    const targetMinF = 82.41 * Math.pow(2, astOffsetGrave / 12);
    const targetMaxF = 392.0 * Math.pow(2, astOffsetAgudo / 12);

    // O que o usuário realmente cantou de mais grave e mais agudo
    const userMinF = getMinFreq(capturedGraveSamples) || targetMinF;
    const userMaxF = getMaxFreq(capturedAgudoSamples) || targetMaxF;

    // Discrepância em semitons = 12 * Math.log2(f1 / f2)
    const minDiscrepancy = Math.abs(12 * Math.log2(userMinF / targetMinF));
    const maxDiscrepancy = Math.abs(12 * Math.log2(userMaxF / targetMaxF));

    // Se a discrepância for muito grande (> 3 semitons), usamos a voz do microfone
    const finalMinF = minDiscrepancy > 3 ? userMinF : targetMinF;
    const finalMaxF = maxDiscrepancy > 3 ? userMaxF : targetMaxF;

    const min = {
      name: freqToNoteName(finalMinF),
      freq: finalMinF,
    };
    const max = {
      name: freqToNoteName(finalMaxF),
      freq: finalMaxF,
    };
    onFinish("assistant", min, max);
  };

  return (
    <>
      {step === 1 && (
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
              <span style={{ color: "#b91c1c", fontSize: "1.2rem", fontWeight: 500 }}>
                Tenho voz de
              </span>
              <h2 style={{ margin: 0, color: "#b91c1c", marginTop: "0.75rem", fontSize: "2.2rem" }}>
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
              <span style={{ color: "#b91c1c", fontSize: "1.2rem", fontWeight: 500 }}>
                Tenho voz de
              </span>
              <h2 style={{ margin: 0, color: "#b91c1c", marginTop: "0.75rem", fontSize: "2.2rem" }}>
                MULHER
              </h2>
            </button>
          </div>
        </div>
      )}

      {step === 1.5 && (
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
                key={o.key}
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

      {(step === 2 || step === 3) && (
        <div className="step-pane text-center" style={{ animation: "fadeIn 0.4s ease" }}>
          <h2>{step === 2 ? "Passo 2: vamos encontrar sua nota mais grave" : "Passo 3: vamos encontrar sua nota mais aguda"}</h2>
          <p className="mb-4">
            {step === 2
              ? "Tente cantar a seguinte estrofe com o áudio de referência."
              : "Tente cantar a estrofe abaixo. Atenção: cante forte, mas sem gritar!"}
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
              <strong style={{ color: "#b91c1c" }}>Cante assim:</strong>
              <button
                className="btn btn-primary"
                style={{ padding: "0.5rem" }}
                onClick={() =>
                  toggleAstAudio(step === 2 ? "769" : "824", step === 2 ? astOffsetGrave : astOffsetAgudo)
                }
              >
                {astPlaying ? <Square size={18} /> : <Play size={18} />}
              </button>
            </div>
            
            <h4 style={{ color: "#b91c1c", textAlign: "center" }}>
              {step === 2 ? "IAHWEH, TU ÉS MEU DEUS" : "SE O SENHOR NÃO CONSTRÓI A CASA"}
            </h4>
            
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "1.1rem",
                marginTop: "1.5rem",
                lineHeight: 2,
              }}
            >
              {step === 2 ? (
                <>
                  <span style={{ color: "#b91c1c" }}>Mi-</span>{" "}
                  <span style={{ color: "#b91c1c" }}>Si7</span>
                  <br />
                  IAHWEH, TU ÉS MEU DEUS,
                  <br />
                  <br />{" "}
                  <span style={{ color: "#b91c1c" }}>Mi-</span>
                  <br />
                  EU TE LOUVAREI.
                </>
              ) : (
                <>
                  <span style={{ color: "#b91c1c" }}>Do</span>{" "}
                  <span style={{ color: "#b91c1c" }}>La-</span>{" "}
                  <span style={{ color: "#b91c1c" }}>Fa</span>
                  <br />
                  SE O SENHOR NÃO CONSTRÓI A CASA,
                  <br />
                  <br />{" "}
                  <span style={{ color: "#b91c1c" }}>Mi</span>{" "}
                  <span style={{ color: "#b91c1c" }}>La-</span>
                  <br />
                  EM VÃO TRABALHAM OS CONSTRUTORES.
                </>
              )}
            </div>
          </div>

          {/* O microfone continua rodando em background para a análise inteligente, mas sem poluir a interface do usuário */}

          <div className="mt-4">
            <p style={{ fontSize: "1.2rem" }}>Conseguiu cantar?</p>
            {showFeedbackAst ? (
              <div
                style={{
                  color: "green",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                }}
              >
                {step === 2 ? "Excelente! Ajustando..." : "Muito bom! Ajustando..."}
              </div>
            ) : (
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
                  onClick={step === 2 ? astGraveNao : astAgudoNao}
                  disabled={showFeedbackAst}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <ThumbsDown size={18} />
                  {step === 2 ? "Não, já está no meu limite" : "Não, já está no meu limite"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={step === 2 ? astGraveSim : astAgudoSim}
                  disabled={showFeedbackAst}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <ThumbsUp size={18} />
                  Sim, consigo!
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(AssistantStep);
