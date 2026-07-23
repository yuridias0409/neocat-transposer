import React from 'react';
import { useParams } from 'react-router-dom';
import { Settings2, SlidersHorizontal, Users, Book, ThumbsUp, ThumbsDown } from 'lucide-react';
import { transposeChordString } from '../../../utils';
import { otimizarCapoETom } from '../../../utils/capoEngine';
import { calcularTomIdealInteligente } from '../../../utils/transpositionEngine';
import { useCantoController } from '../../../controllers/useCantoController';
import { AudioPlayerView } from '../../components/Canto/AudioPlayerView';
import { KaraokePanelView } from '../../components/Canto/KaraokePanelView';
import capoIcon from '../../../assets/capotraste.png';
import './Canto.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const Canto = ({ user }) => {
  const { id } = useParams();

  const {
    canto,
    baseOffset,
    transposition, setTransposition,
    isPlaying, togglePlay,
    isAudioLoaded, progress, currentTime, duration, handleSeek,
    userProfile,
    notes, setNotes, showNotes, setShowNotes, saveNotes,
    showChordGuide, setShowChordGuide,
    isKaraokeMode, currentMicHz, pitchData, startKaraoke, stopKaraoke,
    toastMessage, showToast,
    aiMessage, initialTransposition, isToneSaved, salvarTomPreferido,
    aplicarTomInteligente,
    tomEsforco, setTomEsforco,
    capoInfo
  } = useCantoController(id, user);

  if (!canto) return _jsxDEV("div", { className: "container canto-page", children: _jsxDEV("p", { children: "Canto não encontrado." }, void 0, false) }, void 0, false);

  const tomAtualVisual = transposeChordString(canto.tom_original, transposition);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAssemblyStatus = () => {
    const songMaxFreq = canto.freq_max_curada || canto.freq_max_global;
    if (!songMaxFreq || songMaxFreq === -Infinity) return null;

    const currentMaxFreq = songMaxFreq * Math.pow(2, transposition / 12);
    const assemblyMaxLimit = 246.94;
    const idealAssemblyTransposition = Math.floor(12 * Math.log2(assemblyMaxLimit / songMaxFreq));
    const capoEquiv = transposition - idealAssemblyTransposition > 0 && transposition - idealAssemblyTransposition <= 11;

    if (capoEquiv) return null;

    if (transposition === idealAssemblyTransposition) {
      return (
        _jsxDEV("div", { className: "alert alert-success mb-4", style: { backgroundColor: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }, children: [
          _jsxDEV("strong", { children: [_jsxDEV(Users, { size: 18, style: { marginRight: '0.5rem', verticalAlign: 'text-bottom' } }, void 0, false), " Cenário Perfeito:"] }, void 0, true),
          _jsxDEV("p", { style: { margin: '0.5rem 0 0 0' }, children: ["Este tom (", tomAtualVisual, ") é o ideal para a assembleia também cantar o refrão confortavelmente!"] }, void 0, true)] }, void 0, true
        ));

    }

    if (currentMaxFreq > assemblyMaxLimit) {
      return (
        _jsxDEV("div", { className: "alert alert-warning mb-4", style: { backgroundColor: '#fef3c7', color: '#92400e', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a' }, children: [
          _jsxDEV("strong", { children: [_jsxDEV(Users, { size: 18, style: { marginRight: '0.5rem', verticalAlign: 'text-bottom' } }, void 0, false), " Assembleia Desconfortável"] }, void 0, true),
          _jsxDEV("p", { style: { margin: '0.5rem 0 0 0' }, children: ["O refrão está muito agudo para o povo. Sugerimos ", idealAssemblyTransposition > 0 ? `+${idealAssemblyTransposition}` : idealAssemblyTransposition, " semitons se a prioridade for a participação da assembleia."] }, void 0, true)] }, void 0, true
        ));

    }
    return null;
  };

  return (
    _jsxDEV("div", { className: "container canto-page", style: { position: 'relative' }, children: [
      toastMessage &&
      _jsxDEV("div", { style: {
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#333', color: 'white', padding: '1rem 2rem', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, whiteSpace: 'pre-line',
          textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '1rem'
        }, children:
        toastMessage }, void 0, false
      ),

      _jsxDEV("div", { className: "canto-header mb-4", children:
        _jsxDEV("div", { className: "canto-title-block", style: { width: '100%' }, children: [
          _jsxDEV("h1", { style: { marginBottom: '0.5rem' }, children: canto.titulo }, void 0, false),
          _jsxDEV("div", { className: "canto-meta-info", style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }, children: [
            _jsxDEV("span", { className: "badge badge-primary", children: ["Tom Original: ", canto.tom_original] }, void 0, true),
            (() => {
              const savedOffset = userProfile?.cantos_validados?.[id];
              let badgeOffset = savedOffset;
              let isSaved = true;

              if (savedOffset === undefined && userProfile) {
                const vozSalmista = {
                  minHz: userProfile.f0_min || 110,
                  maxHz: userProfile.f0_max || 330,
                  tipoVoz: userProfile.tipoVoz || 'Desconhecido'
                };
                const res = calcularTomIdealInteligente(vozSalmista, canto, userProfile);
                if (res) badgeOffset = res.semitones;
                isSaved = false;
              }

              if (badgeOffset !== undefined && canto.tom_original !== '?') {
                const badgeCapo = otimizarCapoETom(canto.tom_original, badgeOffset);
                return _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '0.5rem' }, children: [
                  _jsxDEV("span", { style: { color: isSaved ? '#15803d' : '#ca8a04', fontSize: '0.8rem', fontWeight: 'bold', marginRight: '4px' }, children: isSaved ? "✅ Tom Salvo:" : "Sugerido:" }, void 0, false),
                  _jsxDEV("span", { style: { background: isSaved ? '#dcfce7' : '#e0f2fe', color: isSaved ? '#166534' : '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem' }, children: ["🎸 ", badgeCapo.formaAcorde] }, void 0, true),
                  badgeCapo.capoCasa > 0 && _jsxDEV("span", { style: { background: isSaved ? '#dcfce7' : '#fef3c7', color: isSaved ? '#166534' : '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }, children: [
                    _jsxDEV("img", { src: capoIcon, alt: "Capo", style: { width: '14px', height: '14px', filter: isSaved ? 'none' : 'hue-rotate(20deg) saturate(150%) brightness(0.8)' } }, void 0, false), `Capo ${badgeCapo.capoCasa}ª`
                  ] }, void 0, true)
                ] }, void 0, true);
              }
              return null;
            })()
          ] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      ),

      renderAssemblyStatus(),

      _jsxDEV("div", { className: "canto-desktop-grid", children: [
        _jsxDEV("div", { className: "canto-left-col", children: [
          canto.audio_url &&
          _jsxDEV(_Fragment, { children: [
            _jsxDEV(AudioPlayerView, {
              canto: canto,
              isPlaying: isPlaying,
              togglePlay: togglePlay,
              isAudioLoaded: isAudioLoaded,
              progress: progress,
              currentTime: currentTime,
              duration: duration,
              handleSeek: handleSeek,
              isKaraokeMode: isKaraokeMode,
              startKaraoke: startKaraoke,
              stopKaraoke: stopKaraoke,
              formatTime: formatTime }, void 0, false
            ),
            _jsxDEV(KaraokePanelView, {
              isKaraokeMode: isKaraokeMode,
              userProfile: userProfile,
              currentMicHz: currentMicHz,
              pitchData: pitchData,
              currentTime: currentTime,
              transposition: transposition,
              baseOffset: baseOffset }, void 0, false
            )] }, void 0, true
          ),

          user &&
          _jsxDEV("div", { className: `notepad-section mb-0 ${showNotes ? 'expanded' : ''}`, children:
            _jsxDEV("div", { className: `card notepad-card-container ${showNotes ? 'expanded' : ''}`, style: { backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.3s ease', borderRadius: '12px' }, children: [
              _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', cursor: 'pointer' }, onClick: () => setShowNotes(!showNotes), children: [
                _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [
                  _jsxDEV(Book, { size: 18, color: '#0ea5e9' }, void 0, false), " ", _jsxDEV("strong", { style: { fontWeight: '600' }, children: "Anotações do Salmista" }, void 0, false)] }, void 0, true
                ),
                _jsxDEV("div", { style: { position: 'relative', width: '40px', height: '24px', backgroundColor: showNotes ? '#0ea5e9' : '#cbd5e1', borderRadius: '24px', transition: '0.3s', display: 'flex', alignItems: 'center', padding: '2px' }, children:
                  _jsxDEV("div", { style: { width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s', transform: showNotes ? 'translateX(16px)' : 'translateX(0)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' } }, void 0, false) }, void 0, false
                )] }, void 0, true
              ),
              showNotes &&
              _jsxDEV("textarea", {
                className: "notepad-textarea",
                value: notes,
                onChange: (e) => setNotes(e.target.value),
                onBlur: saveNotes,
                placeholder: "Escreva dicas, ritmos ou lembretes sobre este canto...",
                style: { width: '100%', minHeight: '80px', border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', resize: 'none', marginTop: '1rem', borderTop: '1px dashed #e0d8b0', paddingTop: '1rem' } }, void 0, false
              )] }, void 0, true
            ) }, void 0, false
          )
        ] }, void 0, true),

        _jsxDEV("div", { className: "canto-right-col", children: [
          _jsxDEV("div", { className: "card text-center transpo-card", style: { padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }, children: [
            _jsxDEV("div", { style: { fontSize: '0.8rem', textTransform: 'uppercase', color: '#555', marginBottom: '0.75rem', fontWeight: 'bold' }, children: "Transposição" }, void 0, false
            ),

            _jsxDEV("div", { className: "transposition-controls", style: { background: '#fdfbf7', padding: '0.5rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', marginBottom: '0.5rem' }, children: [
              _jsxDEV("button", { className: "btn-circle btn-sm", onClick: () => setTransposition((t) => t - 1), style: { width: '30px', height: '30px', minWidth: '30px' }, children: "-" }, void 0, false),
              _jsxDEV("span", { className: "transposition-value", style: { fontWeight: 'bold', fontSize: '1.5rem', color: '#851d1d', margin: '0 1.5rem', minWidth: '45px' }, children: capoInfo.tomReal }, void 0, false),
              _jsxDEV("button", { className: "btn-circle btn-sm", onClick: () => setTransposition((t) => t + 1), style: { width: '30px', height: '30px', minWidth: '30px' }, children: "+" }, void 0, false)] }, void 0, true
            ),

            _jsxDEV("div", { style: { fontSize: '0.8rem', color: '#666', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }, children: [
              _jsxDEV("span", { children: [
                transposition - baseOffset === 0 ? '0' : transposition - baseOffset > 0 ? `+${transposition - baseOffset}` : transposition - baseOffset, " semitons"] }, void 0, true
              ),
              capoInfo.formaAcorde !== '?' && (transposition !== baseOffset || transposition !== initialTransposition) &&
              _jsxDEV("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.2rem', alignItems: 'center' }, children: [
                _jsxDEV("span", { style: { background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }, children: ["🎸 Toque ", capoInfo.formaAcorde] }, void 0, true),
                capoInfo.capoCasa > 0 &&
                _jsxDEV("span", { style: { background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }, children: [
                  _jsxDEV("img", { src: capoIcon, alt: "Capo", style: { width: '16px', height: '16px' } }, void 0, false), `Capo ${capoInfo.capoCasa}ª`
                ] }, void 0, true)] }, void 0, true
              ),
              
              transposition !== 0 &&
              _jsxDEV("button", {
                onClick: () => setTransposition(0),
                style: { background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '0.5rem', fontWeight: '600' },
                children: `Voltar ao Tom Original (${canto.tom_original})`
              }, void 0, false),

              canto.audio_url && canto.tom_audio && canto.tom_audio !== '?' &&
              _jsxDEV("div", { style: { fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }, children: `Áudio gravado em ${canto.tom_audio}` }, void 0, false)
            ] }, void 0, true
            ),

            _jsxDEV("div", { style: { display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto' }, children: [
              _jsxDEV("button", { className: "btn btn-secondary btn-sm", onClick: aplicarTomInteligente, style: { flex: '1 1 140px' }, children: [
                _jsxDEV(Settings2, { size: 14, style: { marginRight: '0.4rem' } }, void 0, false), " Meu Tom Ideal"] }, void 0, true
              ),
              
              user && initialTransposition !== null && transposition !== initialTransposition && !isToneSaved &&
              _jsxDEV("button", { className: "btn btn-outline btn-sm", onClick: salvarTomPreferido, style: { flex: '1 1 100%', borderColor: '#bbf7d0', color: '#16a34a', background: '#f0fdf4', marginTop: '0.5rem', fontWeight: 'bold' }, children: [
                _jsxDEV(ThumbsUp, { size: 14, style: { marginRight: '0.4rem' } }, void 0, false), " Salvar este Tom como Preferido"] }, void 0, true
              ),

              tomEsforco !== null && tomEsforco !== transposition &&
              _jsxDEV("button", { className: "btn btn-outline btn-sm w-100", onClick: () => {setTransposition(tomEsforco);setTomEsforco(null);}, style: { borderColor: '#fcd34d', color: '#b45309', background: '#fffbeb' }, children: "💡 Sugestão: Tentar Tom de Esforço" }, void 0, false
              )] }, void 0, true
            )
          ] }, void 0, true
          )
        ] }, void 0, true)
      ] }, void 0, true),

      _jsxDEV("div", { className: "cifra-container card text-center", style: { position: 'relative', paddingTop: '2rem' }, children: [
        _jsxDEV("div", { style: { display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'center', alignItems: 'center', textAlign: 'left' }, children: [

          (!canto.linhas || canto.linhas.length === 0) && canto.acordes_usados && canto.acordes_usados.length > 0 && (transposition !== 0 || transposition !== initialTransposition) &&
          _jsxDEV("div", { style: { width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }, children: [
            _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#555', background: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', width: '100%', maxWidth: '200px' }, children: [
              _jsxDEV("input", { type: "checkbox", id: "chordGuideToggleSidebar", checked: showChordGuide, onChange: (e) => setShowChordGuide(e.target.checked), style: { cursor: 'pointer', width: '14px', height: '14px', accentColor: '#0369a1' } }, void 0, false),
              _jsxDEV("label", { htmlFor: "chordGuideToggleSidebar", style: { cursor: 'pointer', margin: 0, fontWeight: 'bold' }, children: "Guia de Acordes" }, void 0, false)] }, void 0, true
            ),

            showChordGuide &&
            _jsxDEV("div", { className: "guia-acordes-sidebar", style: { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.75rem', width: '100%' }, children: [
              _jsxDEV("div", { style: { color: '#0369a1', marginBottom: '0.5rem', textAlign: 'center' }, children: [
                _jsxDEV("strong", { style: { fontSize: '0.9rem' }, children: [_jsxDEV(SlidersHorizontal, { size: 14, style: { marginRight: '0.3rem', verticalAlign: 'text-bottom' } }, void 0, false), " Guia de Acordes"] }, void 0, true),
                _jsxDEV("p", { style: { margin: '0.25rem 0 0 0', fontSize: '0.75rem' }, children: "A imagem não muda, use este guia para tocar no novo tom:" }, void 0, false)] }, void 0, true
              ),
              _jsxDEV("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontFamily: 'monospace', fontSize: '1rem', justifyContent: 'center' }, children:
                canto.acordes_usados.map((c, i) =>
                _jsxDEV("div", { style: { background: '#fff', padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1px solid #e0f2fe', textAlign: 'center', flex: '1 1 auto', minWidth: '45px' }, children: [
                  _jsxDEV("div", { style: { color: '#94a3b8', fontSize: '0.7rem', textDecoration: 'line-through' }, children: c }, void 0, false),
                  _jsxDEV("div", { style: { color: '#b91c1c', fontWeight: 'bold' }, children: transposeChordString(c, capoInfo.diferencaFormaSemitons) }, void 0, false)] }, i, true
                )
                ) }, void 0, false
              )] }, void 0, true
            )] }, void 0, true
          ),

          _jsxDEV("div", { style: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [

            canto.imagens_originais && canto.imagens_originais.length > 0 ?
            _jsxDEV("div", { className: "cifra-imagens-sheet text-center", style: { width: '100%' }, children:
              canto.imagens_originais.map((imgUrl, i) =>
              _jsxDEV("img", {

                src: imgUrl,
                alt: `Ficha ${i + 1}`,
                referrerPolicy: "no-referrer",
                style: { maxWidth: '100%', height: 'auto', marginBottom: '1rem', border: '1px solid #eee', borderRadius: '8px' } }, i, false
              )
              ) }, void 0, false
            ) :

            _jsxDEV("div", { className: "p-4", style: { color: '#666' }, children: "Nenhuma cifra em texto ou imagem encontrada para este canto." }, void 0, false

            )] }, void 0, true

          )] }, void 0, true

        )] }, void 0, true
      )] }, void 0, true
    ));

};

export default Canto;