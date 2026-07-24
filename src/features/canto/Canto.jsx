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
    return _jsxDEV(
      "div",
      {
        className: "container canto-page",
        children: _jsxDEV(
          "p",
          {
            children: "Canto não encontrado.",
          },
          void 0,
          false,
        ),
      },
      void 0,
      false,
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
  return _jsxDEV(
    "div",
    {
      className: "container canto-page",
      style: {
        position: "relative",
      },
      children: [
        toastMessage &&
          _jsxDEV(
            "div",
            {
              style: {
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
              },
              children: toastMessage,
            },
            void 0,
            false,
          ),
        _jsxDEV(
          "div",
          {
            className: "canto-header mb-4",
            children: _jsxDEV(
              "div",
              {
                className: "canto-title-block",
                style: {
                  width: "100%",
                },
                children: [
                  _jsxDEV(
                    "h1",
                    {
                      style: {
                        marginBottom: "0.5rem",
                      },
                      children: canto.titulo,
                    },
                    void 0,
                    false,
                  ),
                  _jsxDEV(
                    "div",
                    {
                      className: "canto-meta-info",
                      style: {
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                      },
                      children: [
                        _jsxDEV(
                          "span",
                          {
                            className: "badge badge-primary",
                            children: ["Tom Original: ", canto.tom_original],
                          },
                          void 0,
                          true,
                        ),
                        (() => {
                          let badgeOffset =
                            savedTransposition !== null &&
                            savedTransposition !== undefined
                              ? savedTransposition
                              : initialTransposition;
                          let hasSavedTone =
                            savedTransposition !== null &&
                            savedTransposition !== undefined;
                          if (
                            badgeOffset !== undefined &&
                            badgeOffset !== null &&
                            canto.tom_original !== "?"
                          ) {
                            const badgeCapo = otimizarCapoETom(
                              canto.tom_original,
                              badgeOffset,
                            );
                            return _jsxDEV(
                              "div",
                              {
                                style: {
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginLeft: "0.5rem",
                                },
                                children: [
                                  _jsxDEV(
                                    "span",
                                    {
                                      style: {
                                        color: hasSavedTone
                                          ? "#15803d"
                                          : "#ca8a04",
                                        fontSize: "0.8rem",
                                        fontWeight: "bold",
                                        marginRight: "4px",
                                      },
                                      children: hasSavedTone
                                        ? "✅ Seu Tom:"
                                        : "Sugerido:",
                                    },
                                    void 0,
                                    false,
                                  ),
                                  _jsxDEV(
                                    "span",
                                    {
                                      style: {
                                        background: hasSavedTone
                                          ? "#dcfce7"
                                          : "#e0f2fe",
                                        color: hasSavedTone
                                          ? "#166534"
                                          : "#0369a1",
                                        padding: "0.2rem 0.6rem",
                                        borderRadius: "12px",
                                        fontWeight: "bold",
                                        fontSize: "0.85rem",
                                      },
                                      children: ["🎸 ", badgeCapo.formaAcorde],
                                    },
                                    void 0,
                                    true,
                                  ),
                                  badgeCapo.capoCasa > 0 &&
                                    _jsxDEV(
                                      "span",
                                      {
                                        style: {
                                          background: hasSavedTone
                                            ? "#dcfce7"
                                            : "#fef3c7",
                                          color: hasSavedTone
                                            ? "#166534"
                                            : "#b45309",
                                          padding: "0.2rem 0.6rem",
                                          borderRadius: "12px",
                                          fontWeight: "bold",
                                          fontSize: "0.85rem",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px",
                                        },
                                        children: [
                                          _jsxDEV(
                                            "img",
                                            {
                                              src: capoIcon,
                                              alt: "Capo",
                                              style: {
                                                width: "14px",
                                                height: "14px",
                                                filter: hasSavedTone
                                                  ? "none"
                                                  : "hue-rotate(20deg) saturate(150%) brightness(0.8)",
                                              },
                                            },
                                            void 0,
                                            false,
                                          ),
                                          `Capo ${badgeCapo.capoCasa}ª`,
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
                          return null;
                        })(),
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
          },
          void 0,
          false,
        ),
        _jsxDEV(
          "div",
          {
            className: "canto-desktop-grid",
            children: [
              _jsxDEV(
                "div",
                {
                  className: "canto-left-col",
                  children: [
                    canto.audio_url &&
                      _jsxDEV(
                        _Fragment,
                        {
                          children: [
                            _jsxDEV(
                              AudioPlayerView,
                              {
                                canto: canto,
                                isPlaying: isPlaying,
                                togglePlay: togglePlay,
                                isAudioLoaded: isAudioLoaded,
                                duration: duration,
                                handleSeek: handleSeek,
                                isKaraokeMode: isKaraokeMode,
                                startKaraoke: startKaraoke,
                                stopKaraoke: stopKaraoke,
                                formatTime: formatTime,
                                playerRef: playerRef,
                                startTimeRef: startTimeRef,
                              },
                              void 0,
                              false,
                            ),
                            _jsxDEV(
                              KaraokePanelView,
                              {
                                isKaraokeMode: isKaraokeMode,
                                userProfile: userProfile,
                                currentMicHzRef: currentMicHzRef,
                                pitchData: pitchData,
                                playerRef: playerRef,
                                startTimeRef: startTimeRef,
                                transposition: transposition,
                                baseOffset: baseOffset,
                              },
                              void 0,
                              false,
                            ),
                          ],
                        },
                        void 0,
                        true,
                      ),
                    user && (
                      <NotepadSection
                        showNotes={showNotes}
                        setShowNotes={setShowNotes}
                        notes={notes}
                        setNotes={setNotes}
                        saveNotes={saveNotes}
                      />
                    ),
                  ],
                },
                void 0,
                true,
              ),
              _jsxDEV(
                "div",
                {
                  className: "canto-right-col",
                  children: [
                    _jsxDEV(
                      TranspositionCard,
                      {
                        transposition: transposition,
                        setTransposition: setTransposition,
                        capoInfo: capoInfo,
                        baseOffset: baseOffset,
                        initialTransposition: initialTransposition,
                        canto: canto,
                        aplicarTomInteligente: aplicarTomInteligente,
                        user: user,
                        salvarTomPreferido: salvarTomPreferido,
                        isToneSaved: isToneSaved,
                        setShowSobreModal: setShowSobreModal,
                        tomEsforco: tomEsforco,
                        setTomEsforco: setTomEsforco,
                        aiData: aiData,
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
            className: "cifra-container card text-center",
            style: {
              position: "relative",
              paddingTop: "2rem",
            },
            children: [
              "        ",
              _jsxDEV(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "left",
                  },
                  children: [
                    canto.acordes_usados &&
                      canto.acordes_usados.length > 0 &&
                      transposition !== 0 &&
                      _jsxDEV(
                        "div",
                        {
                          style: {
                            width: "100%",
                            maxWidth: "500px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                            alignItems: "center",
                            marginBottom: "1rem",
                          },
                          children: [
                            _jsxDEV(
                              "div",
                              {
                                style: {
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
                                },
                                children: [
                                  _jsxDEV(
                                    "input",
                                    {
                                      type: "checkbox",
                                      id: "chordGuideToggleSidebar",
                                      checked: showChordGuide,
                                      onChange: (e) =>
                                        setShowChordGuide(e.target.checked),
                                      style: {
                                        cursor: "pointer",
                                        width: "14px",
                                        height: "14px",
                                        accentColor: "#0369a1",
                                      },
                                    },
                                    void 0,
                                    false,
                                  ),
                                  _jsxDEV(
                                    "label",
                                    {
                                      htmlFor: "chordGuideToggleSidebar",
                                      style: {
                                        cursor: "pointer",
                                        margin: 0,
                                        fontWeight: "bold",
                                      },
                                      children: "Guia de Acordes",
                                    },
                                    void 0,
                                    false,
                                  ),
                                ],
                              },
                              void 0,
                              true,
                            ),
                            showChordGuide &&
                              _jsxDEV(
                                "div",
                                {
                                  className: "guia-acordes-sidebar",
                                  style: {
                                    backgroundColor: "#f0f9ff",
                                    border: "1px solid #bae6fd",
                                    borderRadius: "10px",
                                    padding: "0.75rem",
                                    width: "100%",
                                  },
                                  children: [
                                    _jsxDEV(
                                      "div",
                                      {
                                        style: {
                                          color: "#0369a1",
                                          marginBottom: "0.5rem",
                                          textAlign: "center",
                                        },
                                        children: [
                                          _jsxDEV(
                                            "strong",
                                            {
                                              style: {
                                                fontSize: "0.9rem",
                                              },
                                              children: [
                                                _jsxDEV(
                                                  SlidersHorizontal,
                                                  {
                                                    size: 14,
                                                    style: {
                                                      marginRight: "0.3rem",
                                                      verticalAlign:
                                                        "text-bottom",
                                                    },
                                                  },
                                                  void 0,
                                                  false,
                                                ),
                                                " Guia de Acordes",
                                              ],
                                            },
                                            void 0,
                                            true,
                                          ),
                                          _jsxDEV(
                                            "p",
                                            {
                                              style: {
                                                margin: "0.25rem 0 0 0",
                                                fontSize: "0.75rem",
                                              },
                                              children:
                                                "A imagem não muda, use este guia para tocar no novo tom:",
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
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: "0.4rem",
                                          fontFamily: "monospace",
                                          fontSize: "1rem",
                                          justifyContent: "center",
                                        },
                                        children: canto.acordes_usados.map(
                                          (c, i) =>
                                            _jsxDEV(
                                              "div",
                                              {
                                                style: {
                                                  background: "#fff",
                                                  padding: "0.2rem 0.4rem",
                                                  borderRadius: "6px",
                                                  border: "1px solid #e0f2fe",
                                                  textAlign: "center",
                                                  flex: "1 1 auto",
                                                  minWidth: "45px",
                                                },
                                                children: [
                                                  _jsxDEV(
                                                    "div",
                                                    {
                                                      style: {
                                                        color: "#94a3b8",
                                                        fontSize: "0.7rem",
                                                        textDecoration:
                                                          "line-through",
                                                      },
                                                      children:
                                                        transposeChordString(
                                                          c,
                                                          0,
                                                        ),
                                                    },
                                                    void 0,
                                                    false,
                                                  ),
                                                  _jsxDEV(
                                                    "div",
                                                    {
                                                      style: {
                                                        color: "#b91c1c",
                                                        fontWeight: "bold",
                                                      },
                                                      children:
                                                        transposeChordString(
                                                          c,
                                                          capoInfo.diferencaFormaSemitons,
                                                        ),
                                                    },
                                                    void 0,
                                                    false,
                                                  ),
                                                ],
                                              },
                                              i,
                                              true,
                                            ),
                                        ),
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
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        },
                        children: [
                          canto.imagens_originais &&
                          canto.imagens_originais.length > 0
                            ? _jsxDEV(
                                "div",
                                {
                                  className: "cifra-imagens-sheet text-center",
                                  style: {
                                    width: "100%",
                                  },
                                  children: canto.imagens_originais.map(
                                    (imgUrl, i) =>
                                      _jsxDEV(
                                        "img",
                                        {
                                          src: imgUrl,
                                          alt: `Ficha ${i + 1}`,
                                          referrerPolicy: "no-referrer",
                                          style: {
                                            maxWidth: "100%",
                                            height: "auto",
                                            marginBottom: "1rem",
                                            border: "1px solid #eee",
                                            borderRadius: "8px",
                                          },
                                        },
                                        i,
                                        false,
                                      ),
                                  ),
                                },
                                void 0,
                                false,
                              )
                            : _jsxDEV(
                                "div",
                                {
                                  className: "p-4",
                                  style: {
                                    color: "#666",
                                  },
                                  children:
                                    "Nenhuma cifra em texto ou imagem encontrada para este canto.",
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
        <ToneInfoModal
          showSobreModal={showSobreModal}
          setShowSobreModal={setShowSobreModal}
          aiData={aiData}
          canto={canto}
          capoInfo={capoInfo}
          userProfile={userProfile}
          transposition={transposition}
          tomEsforco={tomEsforco}
        />,
      ],
    },
    void 0,
    true,
  );
};
export default Canto;
