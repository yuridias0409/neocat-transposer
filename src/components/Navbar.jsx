import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic2, LogOut, User, Menu, X, ChevronDown } from 'lucide-react';
import './Navbar.css';

const freqToNoteName = (freq) => {
  if (!freq) return '?';
  const notes = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  const h = Math.round(12 * Math.log2(freq / c0));
  const octave = Math.floor(h / 12);
  const n = (h % 12 + 12) % 12;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDesktopDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDesktopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem('userVoiceProfile');
      if (saved) {
        try { setVoiceProfile(JSON.parse(saved)); } catch {}
      }
    };
    load();
    window.addEventListener('storage', load);

    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener('storage', load); clearInterval(interval); };
  }, []);

  const voiceType = voiceProfile ? getVoiceType(voiceProfile.min?.freq) : null;
  const voiceRange = voiceProfile ? 
    `${freqToNoteName(voiceProfile.min?.freq)} → ${freqToNoteName(voiceProfile.max?.freq)}` : 
    null;

  const UserMenuContent = ({ onClick }) => (
    <div className="user-profile-info" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.2s', paddingRight: onClick ? '0.5rem' : '0.75rem' }}>
      <div className="user-details">
        <span className="user-name">{user.split('@')[0]}</span>
        {voiceType && (
          <div className="voice-badge">
            <span className="voice-type-text">{voiceType}</span>
            <span className="voice-range-text">{voiceRange}</span>
          </div>
        )}
      </div>
      {onClick && (
        <ChevronDown size={16} color="#8898aa" style={{ marginLeft: '0.25rem' }} />
      )}
    </div>
  );

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-content">
          {/* Left Zone: Logo */}
          <div className="navbar-left">
            <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <img src="/new-icon-without-background.png" alt="Logo" className="logo-img" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="font-neocat logo-title">Tom do Salmista</span>
                <span className="logo-subtitle">Salmistas do Caminho Neocatecumenal</span>
              </div>
            </Link>
          </div>

          {/* Center Zone: Navigation */}
          <div className="navbar-center desktop-only">
            <Link to="/" className="nav-link-main">Cantos</Link>
          </div>

          {/* Right Zone: Actions & Profile */}
          <div className="navbar-right desktop-only">
            <Link to="/calibrador" className="btn btn-secondary btn-sm calib-btn">
              <Mic2 size={16} />
              <span>Calibrar Voz</span>
            </Link>
            
            {user && (
              <>
                <div className="navbar-divider"></div>
                <div className="user-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
                <UserMenuContent onClick={() => setIsDesktopDropdownOpen(!isDesktopDropdownOpen)} />
                
                {isDesktopDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <Link to="/calibrador" className="dropdown-item">
                      <Mic2 size={16} />
                      <span>Calibrar a voz</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={onLogout} className="dropdown-item text-danger">
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
              </>
            )}
          </div>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={28} color="#962828" />
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Mobile Side Menu */}
      <div className={`mobile-side-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="font-neocat" style={{ fontSize: '1.5rem', letterSpacing: '1px', color: '#962828' }}>Menu</span>
          <button 
            className="mobile-close-btn" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={28} color="#962828" />
          </button>
        </div>

        <div className="mobile-menu-content">
          <div className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link font-neocat">Salmistas</Link>
            <Link to="/" className="mobile-nav-link font-neocat" style={{ fontSize: '1.4rem', opacity: 0.85 }}>Cantos</Link>
          </div>

          <div className="mobile-actions">
            <Link to="/calibrador" className="btn btn-secondary mobile-calib-btn">
              <Mic2 size={18} />
              <span>Calibrar Voz</span>
            </Link>
          </div>

          {user && (
            <div className="mobile-user-section">
              <UserMenuContent />
              <button onClick={onLogout} className="mobile-logout-btn">
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;