import React from "react";
import { useParams } from "react-router-dom";
import {
  Settings2,
  SlidersHorizontal,
  Users,
  Book,
  ThumbsUp,
  ThumbsDown,
  X,
  Info,
} from "lucide-react";
import { transposeChordString } from "../../utils";
import { calcularTomIdealInteligente } from "../../domain/transpositionEngine";
import { useCantoController } from "../../controllers/useCantoController";
import { AudioPlayerView } from "./components/AudioPlayerView";
import { KaraokePanelView } from "./components/KaraokePanelView";
import { PsalmistStatus } from "./components/PsalmistStatus";
import { AssemblyStatus } from "./components/AssemblyStatus";
import { TranspositionCard } from "./components/TranspositionCard";
import { ToneInfoModal } from "./components/ToneInfoModal";
import { NotepadSection } from "./components/NotepadSection";
import { CantoHeader } from "./components/CantoHeader";
import CantoImagesList from "./components/CantoImagesList";
import CifraViewer from "./components/CifraViewer";
import cifrasData from "../../data/cifras.json";
import "./Canto.css";
import {
  jsxDEV as _jsxDEV,
  Fragment as _Fragment,
} from "react/jsx-dev-runtime";
const Canto = ({ user }) => {
  const { id } = useParams();
  const [showSobreModal, setShowSobreModal] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('cifra');
  const {
    canto,
    baseOffset,
    transposition,
    setTransposition,
    isPlaying,
    togglePlay,
    isAudioLoaded,
    duration,
    handleSeek,
    playerRef,
    startTimeRef,
    offsetRef,
    userProfile,
    notes,
    setNotes,
    showNotes,
    setShowNotes,
    saveNotes,
    showChordGuide,
    setShowChordGuide,
    isKaraokeMode,
    currentMicHzRef,
    pitchData,
    startKaraoke,
    stopKaraoke,
    toastMessage,
    showToast,
    aiMessage,
    aiData,
    initialTransposition,
    savedTransposition,
    isToneSaved,
    salvarTomPreferido,
    aplicarTomInteligente,
    tomEsforco,
    setTomEsforco,
    capoInfo,
  } = useCantoController(id, user);
  if (!canto)
    return (
      <div className="container canto-page">
        <p>Canto não encontrado.</p>
      </div>
    );
  const tomAtualVisual = transposeChordString(
    canto.tom_original,
    transposition,
  );
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  return (
    <div
      className="container canto-page"
      style={{
        position: "relative",
      }}
    >
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "white",
            padding: "1rem 2rem",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            whiteSpace: "pre-line",
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
          }}
        >
          {toastMessage}
        </div>
      )}
      <CantoHeader
        canto={canto}
        savedTransposition={savedTransposition}
        initialTransposition={initialTransposition}
      />
      <div className="canto-desktop-grid">
        <div className="canto-left-col">
          {canto.audio_url && (
            <_Fragment>
              <AudioPlayerView
                canto={canto}
                isPlaying={isPlaying}
                togglePlay={togglePlay}
                isAudioLoaded={isAudioLoaded}
                duration={duration}
                handleSeek={handleSeek}
                isKaraokeMode={isKaraokeMode}
                startKaraoke={startKaraoke}
                stopKaraoke={stopKaraoke}
                formatTime={formatTime}
                playerRef={playerRef}
                startTimeRef={startTimeRef}
              />
              <KaraokePanelView
                isKaraokeMode={isKaraokeMode}
                userProfile={userProfile}
                currentMicHzRef={currentMicHzRef}
                pitchData={pitchData}
                playerRef={playerRef}
                startTimeRef={startTimeRef}
                transposition={transposition}
                baseOffset={baseOffset}
              />
            </_Fragment>
          )}
          {user && (
            <NotepadSection
              showNotes={showNotes}
              setShowNotes={setShowNotes}
              notes={notes}
              setNotes={setNotes}
              saveNotes={saveNotes}
            />
          )}
        </div>
        <div className="canto-right-col">
          <TranspositionCard
            transposition={transposition}
            setTransposition={setTransposition}
            capoInfo={capoInfo}
            baseOffset={baseOffset}
            initialTransposition={initialTransposition}
            canto={canto}
            aplicarTomInteligente={aplicarTomInteligente}
            user={user}
            salvarTomPreferido={salvarTomPreferido}
            isToneSaved={isToneSaved}
            setShowSobreModal={setShowSobreModal}
            tomEsforco={tomEsforco}
            setTomEsforco={setTomEsforco}
            aiData={aiData}
          />
        </div>
      </div>
      <div
        className="cifra-container card text-center"
        style={{
          position: "relative",
          paddingTop: "1rem",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <div className="view-mode-toggle" style={{ display: 'inline-flex', background: 'var(--color-bg-subtle)', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setViewMode('cifra')}
              style={{
                padding: '0.6rem 2rem',
                fontSize: '1.1rem',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'cifra' ? 'var(--color-bg-card)' : 'transparent',
                boxShadow: viewMode === 'cifra' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                fontWeight: viewMode === 'cifra' ? '600' : '500',
                color: viewMode === 'cifra' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cifra
            </button>
            <button 
              onClick={() => setViewMode('ficha')}
              style={{
                padding: '0.6rem 2rem',
                fontSize: '1.1rem',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'ficha' ? 'var(--color-bg-card)' : 'transparent',
                boxShadow: viewMode === 'ficha' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                fontWeight: viewMode === 'ficha' ? '600' : '500',
                color: viewMode === 'ficha' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Ficha
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "left",
          }}
        >
          {canto.acordes_usados &&
            canto.acordes_usados.length > 0 &&
            transposition !== 0 && viewMode === 'ficha' && (
              <div
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    fontSize: "0.85rem",
                    color: "#555",
                    background: "#fff",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    width: "100%",
                    maxWidth: "200px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="chordGuideToggleSidebar"
                    checked={showChordGuide}
                    onChange={(e) => setShowChordGuide(e.target.checked)}
                    style={{
                      cursor: "pointer",
                      width: "14px",
                      height: "14px",
                      accentColor: "#0369a1",
                    }}
                  />
                  <label
                    htmlFor="chordGuideToggleSidebar"
                    style={{
                      cursor: "pointer",
                      margin: 0,
                      fontWeight: "bold",
                    }}
                  >
                    Guia de Acordes
                  </label>
                </div>
                {showChordGuide && (
                  <div
                    className="guia-acordes-sidebar"
                    style={{
                      backgroundColor: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "10px",
                      padding: "0.75rem",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        color: "#0369a1",
                        marginBottom: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "0.9rem",
                        }}
                      >
                        <SlidersHorizontal
                          size={14}
                          style={{
                            marginRight: "0.3rem",
                            verticalAlign: "text-bottom",
                          }}
                        />{" "}
                        Guia de Acordes
                      </strong>
                      <p
                        style={{
                          margin: "0.25rem 0 0 0",
                          fontSize: "0.75rem",
                        }}
                      >
                        A imagem não muda, use este guia para tocar no novo tom:
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                        fontFamily: "monospace",
                        fontSize: "1rem",
                        justifyContent: "center",
                      }}
                    >
                      {canto.acordes_usados.map((c, i) => (
                        <div
                          style={{
                            background: "#fff",
                            padding: "0.2rem 0.4rem",
                            borderRadius: "6px",
                            border: "1px solid #e0f2fe",
                            textAlign: "center",
                            flex: "1 1 auto",
                            minWidth: "45px",
                          }}
                        >
                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: "0.7rem",
                              textDecoration: "line-through",
                            }}
                          >
                            {transposeChordString(c, 0)}
                          </div>
                          <div
                            style={{
                              color: "#b91c1c",
                              fontWeight: "bold",
                            }}
                          >
                            {transposeChordString(
                              c,
                              capoInfo.diferencaFormaSemitons,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {viewMode === 'cifra' && (
              cifrasData[id] ? (
                <CifraViewer 
                  html={cifrasData[id].html} 
                  capoInfo={capoInfo}
                  onShowToneInfoModal={setShowSobreModal}
                />
              ) : (
                <div className="p-4" style={{ color: "#666" }}>
                  Cifra em texto não disponível para este canto ainda.
                </div>
              )
            )}
            
            {viewMode === 'ficha' && (
              canto.imagens_originais && canto.imagens_originais.length > 0 ? (
                <CantoImagesList imagensOriginais={canto.imagens_originais} />
              ) : (
                <div
                  className="p-4"
                  style={{
                    color: "#666",
                  }}
                >
                  Nenhuma cifra em texto ou imagem encontrada para este canto.
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <ToneInfoModal
        showSobreModal={showSobreModal}
        setShowSobreModal={setShowSobreModal}
        aiData={aiData}
        canto={canto}
        capoInfo={capoInfo}
        userProfile={userProfile}
        transposition={transposition}
        tomEsforco={tomEsforco}
      />
    </div>
  );
};
export default Canto;
