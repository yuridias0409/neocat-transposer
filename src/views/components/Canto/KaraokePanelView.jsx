import React, { useRef, useEffect, useState } from 'react';
import * as Tone from 'tone';


const hzToSemitones = (hz) => 12 * Math.log2(hz / 440);

const transposeFreq = (hz, semitones) => hz * Math.pow(2, semitones / 12);

export function KaraokePanelView({
  isKaraokeMode,
  userProfile,
  currentMicHzRef,
  pitchData,
  playerRef,
  startTimeRef,
  transposition,
  baseOffset
}) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const userPitchHistoryRef = useRef([]);

  useEffect(() => {
    if (!isKaraokeMode || !canvasRef.current) return;

    let animationFrameId;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const render = () => {

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isPlaying = playerRef?.current && playerRef.current.state === "started";
      const currentTime = isPlaying ? Tone.now() - startTimeRef.current : 0;
      const currentMicHz = currentMicHzRef?.current || 0;


      const timeWindowPast = 1.5;
      const timeWindowFuture = 3;
      const timeStart = currentTime - timeWindowPast;
      const timeEnd = currentTime + timeWindowFuture;
      const timeRange = timeWindowPast + timeWindowFuture;

      const shiftSemitones = transposition - baseOffset;


      let songMaxHz = 0;
      let songMinHz = 1000;
      if (pitchData && pitchData.length > 0) {
        for (let i = 0; i < pitchData.length; i++) {
          const shiftedHz = transposeFreq(pitchData[i].f, shiftSemitones);
          if (shiftedHz > songMaxHz) songMaxHz = shiftedHz;
          if (shiftedHz < songMinHz && shiftedHz > 0) songMinHz = shiftedHz;
        }
      }


      let minHz = userProfile?.min?.freq || 80;
      let maxHz = userProfile?.max?.freq || 400;
      minHz = Math.min(minHz * 0.6, songMinHz * 0.8, 60);
      maxHz = Math.max(maxHz * 2.0, songMaxHz * 1.3, 700);
      const minSemi = hzToSemitones(minHz);
      const maxSemi = hzToSemitones(maxHz);
      const semiRange = maxSemi - minSemi;

      const getY = (hz) => {
        if (!hz || hz <= 0) return height;
        const semi = hzToSemitones(hz);
        return height - (semi - minSemi) / semiRange * height;
      };

      const getX = (t) => {
        return (t - timeStart) / timeRange * width;
      };


      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);


      const currentX = getX(currentTime);
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height);
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();


      ctx.fillStyle = '#b91c1c';
      ctx.font = '10px monospace';
      ctx.fillText(currentTime.toFixed(1) + "s", currentX + 5, height - 5);


      let currentRefHz = 0;
      let futureRefHz = 0;
      if (pitchData && pitchData.length > 0) {
        ctx.beginPath();
        let started = false;


        const shiftSemitones = transposition - baseOffset;

        for (let i = 0; i < pitchData.length; i++) {
          const pt = pitchData[i];
          if (pt.t >= timeStart && pt.t <= timeEnd) {
            const shiftedHz = transposeFreq(pt.f, shiftSemitones);
            const x = getX(pt.t);
            const y = getY(shiftedHz);

            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }


            if (Math.abs(pt.t - currentTime) < 0.1) {
              currentRefHz = shiftedHz;
            }

            if (Math.abs(pt.t - (currentTime + 1)) < 0.1) {
              futureRefHz = shiftedHz;
            }
          }
        }

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }


      if (currentMicHz > 0) {

        const hist = userPitchHistoryRef.current;
        if (hist.length === 0 || Math.abs(hist[hist.length - 1].t - currentTime) > 0.05) {
          userPitchHistoryRef.current.push({ t: currentTime, f: currentMicHz });
        }
      }

      while (userPitchHistoryRef.current.length > 0 && userPitchHistoryRef.current[0].t < timeStart) {
        userPitchHistoryRef.current.shift();
      }


      if (userPitchHistoryRef.current.length > 0) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < userPitchHistoryRef.current.length; i++) {
          const pt = userPitchHistoryRef.current[i];
          const x = getX(pt.t);
          const y = getY(pt.f);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 4;
        ctx.stroke();
      }


      if (currentRefHz > 0 && currentMicHz > 0) {
        const refSemi = hzToSemitones(currentRefHz);
        const micSemi = hzToSemitones(currentMicHz);
        const diff = micSemi - refSemi;


        if (diff > 2.5) {
          setTooltip({ text: "Cante mais GRAVE! ⬇️", type: 'warning' });
        } else if (diff < -2.5) {
          setTooltip({ text: "Cante mais AGUDO! ⬆️", type: 'warning' });
        } else {

          if (futureRefHz > 0) {
            const futSemi = hzToSemitones(futureRefHz);
            if (futSemi - refSemi > 2.5) {
              setTooltip({ text: "Atenção: Aqui SOBE ↗️", type: 'info' });
            } else if (futSemi - refSemi < -2.5) {
              setTooltip({ text: "Atenção: Aqui DESCE ↘️", type: 'info' });
            } else {
              setTooltip({ text: "Afinado! 🎯", type: 'success' });
            }
          } else {
            setTooltip({ text: "Afinado! 🎯", type: 'success' });
          }
        }
      } else {
        setTooltip(null);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isKaraokeMode, pitchData, transposition, baseOffset, userProfile, playerRef, startTimeRef, currentMicHzRef]);

  if (!isKaraokeMode) return null;

  if (!userProfile) return (
    <div className="card text-center mb-3" style={{ padding: '1rem', border: '1px solid #f87171', background: '#fef2f2' }}>
      <p style={{ color: '#b91c1c', margin: 0 }}>Calibre sua voz primeiro para usar o Karaoke.</p>
    </div>);


  return (
    <div className="karaoke-panel card mb-3" style={{ padding: '1rem', border: '2px solid #0369a1', background: '#f0f9ff', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0369a1', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <span>🎤 Monitoramento ao Vivo</span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '140px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
        
        {}
        {tooltip &&
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
             <span className="badge shadow-sm" style={{
            background: tooltip.type === 'warning' ? '#fef08a' : tooltip.type === 'success' ? '#dcfce7' : '#e0f2fe',
            color: tooltip.type === 'warning' ? '#854d0e' : tooltip.type === 'success' ? '#166534' : '#0369a1',
            padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', animation: 'fadeIn 0.2s ease-in-out',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
               {tooltip.text}
             </span>
          </div>
        }

        <canvas
          ref={canvasRef}
          width={800}
          height={140}
          style={{ width: '100%', height: '100%', display: 'block' }} />
        
        
        {}
        <div style={{ position: 'absolute', top: '4px', left: '8px', fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>Agudo</div>
        <div style={{ position: 'absolute', bottom: '4px', left: '8px', fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>Grave</div>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
         🎧 Aviso: Este modo funciona muito melhor com Fones de Ouvido! (Evita microfonia e atrasos)
      </div>
    </div>);

}