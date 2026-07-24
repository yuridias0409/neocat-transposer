import React, { useState, useRef, useEffect } from "react";
import { PitchDetector } from "pitchy";
import { db } from "../../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { cantosData } from "../../data";
import { Mic, FileAudio, UploadCloud, Square, Play } from "lucide-react";
import CantoDAO from "../../api/CantoDAO";
import { CantoSearchSelect } from "./CantoSearchSelect";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export function AdminDashboard() {
  const [cantoId, setCantoId] = useState("");
  const [tomGravacao, setTomGravacao] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentHz, setCurrentHz] = useState(0);
  const [hzHistory, setHzHistory] = useState([]);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [mlData, setMlData] = useState(null);
  useEffect(() => {
    async function loadMlData() {
      const data = await CantoDAO.getAllCantosMetadata();
      setMlData(data);
    }
    loadMlData();
  }, []);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const startMonitoring = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    streamRef.current = stream;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    setIsRecording(true);
    setHzHistory([]);
    updatePitch();
  };
  const updatePitch = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const inputBuffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(inputBuffer);
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    const [pitch, clarity] = detector.findPitch(
      inputBuffer,
      audioCtxRef.current.sampleRate,
    );
    if (clarity > 0.85 && pitch > 50 && pitch < 1000) {
      const roundedHz = Math.round(pitch * 100) / 100;
      setCurrentHz(roundedHz);
      setHzHistory((prev) => [...prev, roundedHz]);
    }
    animationFrameRef.current = requestAnimationFrame(updatePitch);
  };
  const stopMonitoring = () => {
    cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    setIsRecording(false);
  };
  const handleScanFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanningFile(true);
    setHzHistory([]);
    setScanProgress(0);
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const fileBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(fileBuffer);
    const offlineCtx = new OfflineAudioContext(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate,
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    const channelData = audioBuffer.getChannelData(0);
    const windowSize = 2048;
    const detector = PitchDetector.forFloat32Array(windowSize);
    const sampleRate = audioBuffer.sampleRate;
    const newHistory = [];
    const step = windowSize;
    for (let i = 0; i < channelData.length - windowSize; i += step) {
      const windowData = channelData.slice(i, i + windowSize);
      const [pitch, clarity] = detector.findPitch(windowData, sampleRate);
      if (clarity > 0.85 && pitch > 50 && pitch < 1000) {
        newHistory.push(Math.round(pitch * 100) / 100);
      }
      if (i % (step * 100) === 0) {
        setScanProgress(Math.round((i / channelData.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    setHzHistory(newHistory);
    setIsScanningFile(false);
    setScanProgress(100);
  };
  const handleSaveToFirestore = async () => {
    if (!cantoId || hzHistory.length === 0) {
      alert(
        "Faltam dados: Preencha o ID e faça uma gravação/varredura primeiro.",
      );
      return;
    }
    const sorted = [...hzHistory].sort((a, b) => a - b);
    const minCurada = sorted[Math.floor(sorted.length * 0.05)] || sorted[0];
    const maxCurada =
      sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
    const maxGlobal = sorted[sorted.length - 1];
    const dataToSave = {
      freq_max_global: maxGlobal,
      freq_min_curada: minCurada,
      freq_max_curada: maxCurada,
      freq_min_povo_curada: minCurada,
      freq_max_povo_curada: maxCurada,
      tom_gravacao:
        tomGravacao || cantosData[cantoId]?.tom_original || "Desconhecido",
      atualizado_em: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, "cantos", cantoId), dataToSave, {
        merge: true,
      });
      alert(
        `Dados salvos com sucesso no Firestore para ${cantoId}!\nMin: ${minCurada}Hz | Max: ${maxCurada}Hz`,
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar no Firestore: " + err.message);
    }
  };
  return _jsxDEV(
    "div",
    {
      className: "container",
      style: {
        padding: "2rem",
        fontFamily: "var(--font-body)",
      },
      children: [
        _jsxDEV(
          "h2",
          {
            children: "Mapeador de Frequências Oculto 🎛️",
          },
          void 0,
          false,
        ),
        _jsxDEV(
          "p",
          {
            style: {
              color: "#666",
            },
            children:
              "Nenhum áudio gravado aqui será salvo em mp3. O sistema captura apenas os cálculos físicos (Hz).",
          },
          void 0,
          false,
        ),
        _jsxDEV(
          "div",
          {
            className: "card mb-4",
            style: {
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            },
            children: [
              _jsxDEV(
                "div",
                {
                  style: {
                    zIndex: 10,
                  },
                  children: [
                    _jsxDEV(
                      "label",
                      {
                        style: {
                          fontWeight: "bold",
                          display: "block",
                          marginBottom: "0.5rem",
                        },
                        children: "Selecione o Canto:",
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      CantoSearchSelect,
                      {
                        value: cantoId,
                        onChange: (id) => {
                          setCantoId(id);
                          setTomGravacao(cantosData[id]?.tom_original || "");
                        },
                      },
                      void 0,
                      false,
                    ),
                  ],
                },
                void 0,
                true,
              ),
              _jsxDEV(
                "div",
                {
                  style: {
                    zIndex: 5,
                  },
                  children: [
                    _jsxDEV(
                      "label",
                      {
                        style: {
                          fontWeight: "bold",
                          display: "block",
                          marginBottom: "0.5rem",
                        },
                        children: "Tom Base da Gravação/Áudio:",
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      "input",
                      {
                        type: "text",
                        placeholder: "Ex: La-, Sol, Do, Mi...",
                        value: tomGravacao,
                        onChange: (e) => setTomGravacao(e.target.value),
                        style: {
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          fontSize: "1rem",
                        },
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      "small",
                      {
                        style: {
                          color: "#666",
                        },
                        children:
                          "Diga em qual tom você vai cantar ou em qual tom está o arquivo MP3.",
                      },
                      void 0,
                      false,
                    ),
                  ],
                },
                void 0,
                true,
              ),
            ],
          },
          void 0,
          true,
        ),
        _jsxDEV(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
            },
            children: [
              _jsxDEV(
                "div",
                {
                  className: "card text-center",
                  style: {
                    padding: "2rem",
                  },
                  children: [
                    _jsxDEV(
                      "div",
                      {
                        style: {
                          background: "#fef2f2",
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1rem",
                          color: "#b91c1c",
                        },
                        children: _jsxDEV(
                          Mic,
                          {
                            size: 32,
                          },
                          void 0,
                          false,
                        ),
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      "h4",
                      {
                        children: "Cantar ao Vivo",
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      "p",
                      {
                        style: {
                          fontSize: "0.9rem",
                          color: "#666",
                          marginBottom: "1.5rem",
                        },
                        children:
                          "Cante o canto inteiro para registrar os picos vocais em tempo real.",
                      },
                      void 0,
                      false,
                    ),
                    !isRecording
                      ? _jsxDEV(
                          "button",
                          {
                            className: "btn btn-primary w-100",
                            onClick: startMonitoring,
                            style: {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
                              padding: "0.75rem",
                            },
                            children: [
                              _jsxDEV(
                                Play,
                                {
                                  size: 18,
                                },
                                void 0,
                                false,
                              ),
                              " Começar a Cantar",
                            ],
                          },
                          void 0,
                          true,
                        )
                      : _jsxDEV(
                          "button",
                          {
                            className: "btn btn-outline danger-btn w-100",
                            onClick: stopMonitoring,
                            style: {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
                              padding: "0.75rem",
                            },
                            children: [
                              _jsxDEV(
                                Square,
                                {
                                  size: 18,
                                },
                                void 0,
                                false,
                              ),
                              " Parar Captação",
                            ],
                          },
                          void 0,
                          true,
                        ),
                    isRecording &&
                      _jsxDEV(
                        "h3",
                        {
                          style: {
                            marginTop: "1rem",
                            color: "#0369a1",
                          },
                          children: [currentHz, " Hz"],
                        },
                        void 0,
                        true,
                      ),
                  ],
                },
                void 0,
                true,
              ),
              _jsxDEV(
                "div",
                {
                  className: "card text-center",
                  style: {
                    padding: "2rem",
                  },
                  children: [
                    _jsxDEV(
                      "div",
                      {
                        style: {
                          background: "#f0f9ff",
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1rem",
                          color: "#0369a1",
                        },
                        children: _jsxDEV(
                          FileAudio,
                          {
                            size: 32,
                          },
                          void 0,
                          false,
                        ),
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      "h4",
                      {
                        children: "Analisar MP3",
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      "p",
                      {
                        style: {
                          fontSize: "0.9rem",
                          color: "#666",
                          marginBottom: "1.5rem",
                        },
                        children:
                          "Envie um áudio limpo (preferencialmente só voz) para varredura rápida.",
                      },
                      void 0,
                      false,
                    ),
                    _jsxDEV(
                      "label",
                      {
                        className: "btn btn-secondary w-100",
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          padding: "0.75rem",
                        },
                        children: [
                          _jsxDEV(
                            UploadCloud,
                            {
                              size: 18,
                            },
                            void 0,
                            false,
                          ),
                          " Escolher Arquivo MP3",
                          _jsxDEV(
                            "input",
                            {
                              type: "file",
                              accept: "audio/*",
                              onChange: handleScanFile,
                              disabled: isScanningFile || isRecording,
                              style: {
                                display: "none",
                              },
                            },
                            void 0,
                            false,
                          ),
                        ],
                      },
                      void 0,
                      true,
                    ),
                    isScanningFile &&
                      _jsxDEV(
                        "div",
                        {
                          style: {
                            marginTop: "1rem",
                          },
                          children: [
                            _jsxDEV(
                              "p",
                              {
                                children: [
                                  "Processando... ",
                                  scanProgress,
                                  "%",
                                ],
                              },
                              void 0,
                              true,
                            ),
                            _jsxDEV(
                              "progress",
                              {
                                value: scanProgress,
                                max: "100",
                                style: {
                                  width: "100%",
                                },
                              },
                              void 0,
                              false,
                            ),
                          ],
                        },
                        void 0,
                        true,
                      ),
                  ],
                },
                void 0,
                true,
              ),
            ],
          },
          void 0,
          true,
        ),
        hzHistory.length > 0 &&
          !isRecording &&
          !isScanningFile &&
          _jsxDEV(
            "div",
            {
              className: "card text-center mt-4",
              style: {
                padding: "1.5rem",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
              },
              children: [
                _jsxDEV(
                  "h4",
                  {
                    style: {
                      color: "#166534",
                    },
                    children: "Análise Concluída ✅",
                  },
                  void 0,
                  false,
                ),
                _jsxDEV(
                  "p",
                  {
                    style: {
                      color: "#15803d",
                    },
                    children: [
                      "Total de Pontos de Frequência Registrados: ",
                      _jsxDEV(
                        "strong",
                        {
                          children: hzHistory.length,
                        },
                        void 0,
                        false,
                      ),
                    ],
                  },
                  void 0,
                  true,
                ),
                _jsxDEV(
                  "button",
                  {
                    className: "btn btn-primary",
                    onClick: handleSaveToFirestore,
                    style: {
                      marginTop: "1rem",
                      background: "#15803d",
                    },
                    children: "💾 Salvar Metadados no Firestore",
                  },
                  void 0,
                  false,
                ),
              ],
            },
            void 0,
            true,
          ),
        _jsxDEV(
          "div",
          {
            className: "card mt-5",
            style: {
              padding: "2rem",
            },
            children: [
              _jsxDEV(
                "h3",
                {
                  style: {
                    borderBottom: "2px solid var(--color-bg-secondary)",
                    paddingBottom: "0.5rem",
                    marginBottom: "1.5rem",
                  },
                  children:
                    "📊 Dashboard de Machine Learning (Feedbacks Globais)",
                },
                void 0,
                false,
              ),
              mlData
                ? Object.entries(mlData).filter(
                    ([_, data]) => data.metricas_feedback,
                  ).length > 0
                  ? _jsxDEV(
                      "div",
                      {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                        },
                        children: Object.entries(mlData)
                          .filter(([_, data]) => data.metricas_feedback)
                          .map(([id, data]) => {
                            const m = data.metricas_feedback;
                            const c = cantosData[id];
                            return _jsxDEV(
                              "div",
                              {
                                style: {
                                  padding: "1rem",
                                  background: "var(--color-bg-secondary)",
                                  borderRadius: "8px",
                                },
                                children: [
                                  _jsxDEV(
                                    "h4",
                                    {
                                      style: {
                                        margin: "0 0 0.5rem 0",
                                        color: "var(--color-secondary)",
                                      },
                                      children: c?.titulo || id,
                                    },
                                    void 0,
                                    false,
                                  ),
                                  _jsxDEV(
                                    "div",
                                    {
                                      style: {
                                        display: "flex",
                                        gap: "1rem",
                                        flexWrap: "wrap",
                                        fontSize: "0.9rem",
                                      },
                                      children: [
                                        _jsxDEV(
                                          "span",
                                          {
                                            style: {
                                              background: "#fff",
                                              padding: "0.2rem 0.6rem",
                                              borderRadius: "4px",
                                            },
                                            children: [
                                              _jsxDEV(
                                                "strong",
                                                {
                                                  children: "Total:",
                                                },
                                                void 0,
                                                false,
                                              ),
                                              " ",
                                              m.total_avaliacoes,
                                            ],
                                          },
                                          void 0,
                                          true,
                                        ),
                                        _jsxDEV(
                                          "span",
                                          {
                                            style: {
                                              background: "#e6f4ea",
                                              color: "#166534",
                                              padding: "0.2rem 0.6rem",
                                              borderRadius: "4px",
                                            },
                                            children: [
                                              _jsxDEV(
                                                "strong",
                                                {
                                                  children: "Ótimo:",
                                                },
                                                void 0,
                                                false,
                                              ),
                                              " ",
                                              m.qtd_otimo || 0,
                                            ],
                                          },
                                          void 0,
                                          true,
                                        ),
                                        _jsxDEV(
                                          "span",
                                          {
                                            style: {
                                              background: "#fef2f2",
                                              color: "#991b1b",
                                              padding: "0.2rem 0.6rem",
                                              borderRadius: "4px",
                                            },
                                            children: [
                                              _jsxDEV(
                                                "strong",
                                                {
                                                  children: "Alto Demais:",
                                                },
                                                void 0,
                                                false,
                                              ),
                                              " ",
                                              m.qtd_alto_demais || 0,
                                            ],
                                          },
                                          void 0,
                                          true,
                                        ),
                                        _jsxDEV(
                                          "span",
                                          {
                                            style: {
                                              background: "#fef2f2",
                                              color: "#991b1b",
                                              padding: "0.2rem 0.6rem",
                                              borderRadius: "4px",
                                            },
                                            children: [
                                              _jsxDEV(
                                                "strong",
                                                {
                                                  children: "Baixo Demais:",
                                                },
                                                void 0,
                                                false,
                                              ),
                                              " ",
                                              m.qtd_baixo_demais || 0,
                                            ],
                                          },
                                          void 0,
                                          true,
                                        ),
                                      ],
                                    },
                                    void 0,
                                    true,
                                  ),
                                ],
                              },
                              id,
                              true,
                            );
                          }),
                      },
                      void 0,
                      false,
                    )
                  : _jsxDEV(
                      "p",
                      {
                        style: {
                          color: "#666",
                        },
                        children:
                          "Ainda não há feedbacks de Machine Learning coletados para nenhum canto.",
                      },
                      void 0,
                      false,
                    )
                : _jsxDEV(
                    "p",
                    {
                      style: {
                        color: "#666",
                      },
                      children: "Carregando dados de aprendizado...",
                    },
                    void 0,
                    false,
                  ),
            ],
          },
          void 0,
          true,
        ),
      ],
    },
    void 0,
    true,
  );
}
export default AdminDashboard;
