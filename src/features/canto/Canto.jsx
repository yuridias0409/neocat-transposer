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
import { otimizarCapoETom } from "../../domain/capoEngine";
import { calcularTomIdealInteligente } from "../../domain/transpositionEngine";
import { useCantoController } from "../../controllers/useCantoController";
import { AudioPlayerView } from "./components/AudioPlayerView";
import { KaraokePanelView } from "./components/KaraokePanelView";
import { PsalmistStatus } from "./components/PsalmistStatus";
import { AssemblyStatus } from "./components/AssemblyStatus";
import { TranspositionCard } from "./components/TranspositionCard";
import { ToneInfoModal } from "./components/ToneInfoModal";
import { NotepadSection } from "./components/NotepadSection";
import capoIcon from "../../assets/capotraste.png";
import "./Canto.css";
import {
  jsxDEV as _jsxDEV,
  Fragment as _Fragment,
} from "react/jsx-dev-runtime";
const Canto = ({ user }) => {
  const { id } = useParams();
  const [showSobreModal, setShowSobreModal] = React.useState(false);
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
      <div className="canto-header mb-4">
        <div
          className="canto-title-block"
          style={{
            width: "100%",
          }}
        >
          <h1
            style={{
              marginBottom: "0.5rem",
            }}
          >
            {canto.titulo}
          </h1>
          <div
            className="canto-meta-info"
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span className="badge badge-primary">
              Tom Original: {canto.tom_original}
            </span>
            {(() => {
              let badgeOffset =
                savedTransposition !== null && savedTransposition !== undefined
                  ? savedTransposition
                  : initialTransposition;
              let hasSavedTone =
                savedTransposition !== null && savedTransposition !== undefined;
              if (
                badgeOffset !== undefined &&
                badgeOffset !== null &&
                canto.tom_original !== "?"
              ) {
                const badgeCapo = otimizarCapoETom(
                  canto.tom_original,
                  badgeOffset,
                );
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginLeft: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        color: hasSavedTone ? "#15803d" : "#ca8a04",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        marginRight: "4px",
                      }}
                    >
                      {hasSavedTone ? "✅ Seu Tom:" : "Sugerido:"}
                    </span>
                    <span
                      style={{
                        background: hasSavedTone ? "#dcfce7" : "#e0f2fe",
                        color: hasSavedTone ? "#166534" : "#0369a1",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                      }}
                    >
                      🎸 {badgeCapo.formaAcorde}
                    </span>
                    {badgeCapo.capoCasa > 0 && (
                      <span
                        style={{
                          background: hasSavedTone ? "#dcfce7" : "#fef3c7",
                          color: hasSavedTone ? "#166534" : "#b45309",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "12px",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <img
                          src={capoIcon}
                          alt="Capo"
                          style={{
                            width: "14px",
                            height: "14px",
                            filter: hasSavedTone
                              ? "none"
                              : "hue-rotate(20deg) saturate(150%) brightness(0.8)",
                          }}
                        />
                        {`Capo ${badgeCapo.capoCasa}ª`}
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
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
          paddingTop: "2rem",
        }}
      >
        {" "}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "left",
          }}
        >
          {canto.acordes_usados &&
            canto.acordes_usados.length > 0 &&
            transposition !== 0 && (
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
            {canto.imagens_originais && canto.imagens_originais.length > 0 ? (
              <div
                className="cifra-imagens-sheet text-center"
                style={{
                  width: "100%",
                }}
              >
                {canto.imagens_originais.map((imgUrl, i) => (
                  <img
                    src={imgUrl}
                    alt={`Ficha ${i + 1}`}
                    referrerPolicy="no-referrer"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      marginBottom: "1rem",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="p-4"
                style={{
                  color: "#666",
                }}
              >
                Nenhuma cifra em texto ou imagem encontrada para este canto.
              </div>
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
