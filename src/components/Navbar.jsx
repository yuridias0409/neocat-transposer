import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mic2, LogOut, User } from 'lucide-react';
import './Navbar.css';

const freqToNoteName = (freq) => {
  if (!freq) return '?';
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  const h = Math.round(12 * Math.log2(freq / c0));
  const octave = Math.floor(h / 12);
  const n = ((h % 12) + 12) % 12;
  return `${notes[n]}${octave}`;
};

const getVoiceType = (minFreq) => {
  if (!minFreq) return null;
  if (minFreq < 100) return 'Baixo/Barítono';
  if (minFreq < 150) return 'Tenor/Contralto';
  return 'Soprano/Mezzo';
};

const Navbar = ({ user, onLogout }) => {
  const [voiceProfile, setVoiceProfile] = useState(null);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem('userVoiceProfile');
      if (saved) {
        try { setVoiceProfile(JSON.parse(saved)); } catch {}
      }
    };
    load();
    window.addEventListener('storage', load);
    // Poll for updates in same tab
    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener('storage', load); clearInterval(interval); };
  }, []);

  const voiceType = voiceProfile ? getVoiceType(voiceProfile.min?.freq) : null;
  const voiceRange = voiceProfile
    ? `${freqToNoteName(voiceProfile.min?.freq)} → ${freqToNoteName(voiceProfile.max?.freq)}`
    : null;

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <span className="font-neocat" style={{ fontSize: '1.8rem', letterSpacing: '1px', color: '#962828' }}>Salmistas</span>
        </Link>
        
        <div className="navbar-links">
          <Link to="/calibrador" className="btn btn-secondary btn-sm">
            <Mic2 size={16} />
            <span>Calibrar Voz</span>
          </Link>
          
          {user && (
            <div className="user-menu" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid #ccc', paddingLeft: '1rem'}}>
              <User size={16} className="text-primary" />
              <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.2}}>
                <span style={{fontSize: '0.85rem', color: '#444', fontWeight: 500}}>{user.split('@')[0]}</span>
                {voiceType && (
                  <span style={{fontSize: '0.72rem', color: '#888'}}>
                    {voiceType} · {voiceRange}
                  </span>
                )}
              </div>
              <button onClick={onLogout} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)'}} title="Sair">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
