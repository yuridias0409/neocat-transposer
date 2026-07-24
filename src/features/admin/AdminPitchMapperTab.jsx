import React, { useState, useRef } from "react";
import { PitchDetector } from "pitchy";
import { db } from "../../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { cantosData } from "../../data";
import { Mic, FileAudio, UploadCloud, Square, Play } from "lucide-react";
import { CantoSearchSelect } from "./CantoSearchSelect";

export default function AdminPitchMapperTab() {
  const [cantoId, setCantoId] = useState("");
  const [tomGravacao, setTomGravacao] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentHz, setCurrentHz] = useState(0);
  const [hzHistory, setHzHistory] = useState([]);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

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

  return (
    <>
      <p
        style={{
          color: "#666",
        }}
      >
        Nenhum áudio gravado aqui será salvo em mp3. O sistema captura apenas os
        cálculos físicos (Hz).
      </p>

      <div
        className="card mb-4"
        style={{
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            zIndex: 10,
          }}
        >
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            Selecione o Canto:
          </label>
          <CantoSearchSelect
            value={cantoId}
            onChange={(id) => {
              setCantoId(id);
              setTomGravacao(cantosData[id]?.tom_original || "");
            }}
          />
        </div>

        <div
          style={{
            zIndex: 5,
          }}
        >
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            Tom Base da Gravação/Áudio:
          </label>
          <input
            type="text"
            placeholder="Ex: La-, Sol, Do, Mi..."
            value={tomGravacao}
            onChange={(e) => setTomGravacao(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />
          <small
            style={{
              color: "#666",
            }}
          >
            Diga em qual tom você vai cantar ou em qual tom está o arquivo MP3.
          </small>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <div
          className="card text-center"
          style={{
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "#b91c1c",
            }}
          >
            <Mic size={32} />
          </div>
          <h4>Cantar ao Vivo</h4>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#666",
              marginBottom: "1.5rem",
            }}
          >
            Cante o canto inteiro para registrar os picos vocais em tempo real.
          </p>

          {!isRecording ? (
            <button
              className="btn btn-primary w-100"
              onClick={startMonitoring}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
              }}
            >
              <Play size={18} /> Começar a Cantar
            </button>
          ) : (
            <button
              className="btn btn-outline danger-btn w-100"
              onClick={stopMonitoring}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
              }}
            >
              <Square size={18} /> Parar Captação
            </button>
          )}

          {isRecording && (
            <h3
              style={{
                marginTop: "1rem",
                color: "#0369a1",
              }}
            >
              {currentHz} Hz
            </h3>
          )}
        </div>

        <div
          className="card text-center"
          style={{
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "#f0f9ff",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "#0369a1",
            }}
          >
            <FileAudio size={32} />
          </div>
          <h4>Analisar MP3</h4>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#666",
              marginBottom: "1.5rem",
            }}
          >
            Envie um áudio limpo (preferencialmente só voz) para varredura
            rápida.
          </p>

          <label
            className="btn btn-secondary w-100"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              cursor: "pointer",
              padding: "0.75rem",
            }}
          >
            <UploadCloud size={18} /> Escolher Arquivo MP3
            <input
              type="file"
              accept="audio/*"
              onChange={handleScanFile}
              disabled={isScanningFile || isRecording}
              style={{
                display: "none",
              }}
            />
          </label>
          {isScanningFile && (
            <div
              style={{
                marginTop: "1rem",
              }}
            >
              <p>Processando... {scanProgress}%</p>
              <progress
                value={scanProgress}
                max="100"
                style={{
                  width: "100%",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {hzHistory.length > 0 && !isRecording && !isScanningFile && (
        <div
          className="card text-center mt-4"
          style={{
            padding: "1.5rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          <h4
            style={{
              color: "#166534",
            }}
          >
            Análise Concluída ✅
          </h4>
          <p
            style={{
              color: "#15803d",
            }}
          >
            Total de Pontos de Frequência Registrados:{" "}
            <strong>{hzHistory.length}</strong>
          </p>
          <button
            className="btn btn-primary"
            onClick={handleSaveToFirestore}
            style={{
              marginTop: "1rem",
              background: "#15803d",
            }}
          >
            💾 Salvar Metadados no Firestore
          </button>
        </div>
      )}
    </>
  );
}
