import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic2, LogOut, User, Menu, X, ChevronDown, ShieldCheck, KeyRound } from 'lucide-react';
import { getVoiceClassification } from '../utils/musicMath';
import AuthDAO from '../dao/AuthDAO';
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



const Navbar = ({ user, isAdmin, onLogout }) => {
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

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
    return () => {document.body.style.overflow = '';};
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
        try {setVoiceProfile(JSON.parse(saved));} catch {}
      }
    };
    load();
    window.addEventListener('storage', load);

    const interval = setInterval(load, 3000);
    return () => {window.removeEventListener('storage', load);clearInterval(interval);};
  }, []);

  const voiceType = voiceProfile ? getVoiceClassification(voiceProfile.min?.freq, voiceProfile.max?.freq) : null;
  const voiceRange = voiceProfile ?
  `${freqToNoteName(voiceProfile.min?.freq)} → ${freqToNoteName(voiceProfile.max?.freq)}` :
  null;

  const UserMenuContent = ({ onClick }) =>
  <div className="user-profile-info" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.2s', paddingRight: onClick ? '0.5rem' : '0.75rem' }}>
      <div className="user-details">
        <span className="user-name">{user.split('@')[0]}</span>
        {voiceType &&
      <div className="voice-badge">
            <span className="voice-type-text">{voiceType}:</span>
            <span className="voice-range-text">{voiceRange}</span>
          </div>
      }
      </div>
      {onClick &&
    <ChevronDown size={16} color="#8898aa" style={{ marginLeft: '0.25rem' }} />
    }
    </div>;


  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);
    if (!currentPassword || !newPassword) {
      setPwdError('Preencha as duas senhas.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setPwdLoading(true);
    try {
      await AuthDAO.updateUserPassword(currentPassword, newPassword);
      setPwdSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setPwdError('A senha atual está incorreta.');
      } else {
        setPwdError('Erro ao redefinir a senha.');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-content">
          {}
          <div className="navbar-left">
            <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <img src="/new-icon-without-background.png" alt="Logo" className="logo-img" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="font-neocat logo-title">Tom do Salmista</span>
                <span className="logo-subtitle">Salmistas do Caminho Neocatecumenal</span>
              </div>
            </Link>
          </div>

          {}
          <div className="navbar-center desktop-only">
            <Link to="/" className="nav-link-main">Cantos</Link>
          </div>

          {}
          <div className="navbar-right desktop-only">
            <Link to="/calibrador" className="btn btn-secondary btn-sm calib-btn">
              <Mic2 size={16} />
              <span>Calibrar Voz</span>
            </Link>
            
            {user &&
            <>
                <div className="navbar-divider"></div>
                <div className="user-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
                <UserMenuContent onClick={() => setIsDesktopDropdownOpen(!isDesktopDropdownOpen)} />
                
                {isDesktopDropdownOpen &&
                <div className="user-dropdown-menu">
                    <Link to="/calibrador" className="dropdown-item">
                      <Mic2 size={16} />
                      <span>Calibrar a voz</span>
                    </Link>
                    {isAdmin &&
                  <Link to="/admin" className="dropdown-item text-primary">
                        <ShieldCheck size={16} />
                        <span>Área Admin</span>
                      </Link>
                  }
                    <button onClick={() => {setIsDesktopDropdownOpen(false);setShowPasswordModal(true);}} className="dropdown-item">
                      <KeyRound size={16} />
                      <span>Redefinir Senha</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button onClick={onLogout} className="dropdown-item text-danger">
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                }
              </div>
              </>
            }
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menu">
            
            <Menu size={28} color="#962828" />
          </button>
        </div>
      </nav>

      {}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}>
      </div>

      {}
      <div className={`mobile-side-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="font-neocat" style={{ fontSize: '1.5rem', letterSpacing: '1px', color: '#962828' }}>Menu</span>
          <button
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu">
            
            <X size={28} color="#962828" />
          </button>
        </div>

        <div className="mobile-menu-content">
          <div className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link font-neocat" onClick={() => setIsMobileMenuOpen(false)}>Cantos</Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.dispatchEvent(new Event('triggerInstallApp'));
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'inherit'
              }}
              className="mobile-nav-link font-neocat">
              
              Baixar App
            </button>
          </div>

          <div className="mobile-actions">
            <Link to="/calibrador" className="btn btn-secondary mobile-calib-btn">
              <Mic2 size={18} />
              <span>Calibrar Voz</span>
            </Link>
          </div>

          {user &&
          <div className="mobile-user-section">
              <UserMenuContent />
              
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isAdmin &&
              <Link to="/admin" className="mobile-admin-btn" onClick={() => setIsMobileMenuOpen(false)}>
                    <ShieldCheck size={18} />
                    <span>Área Admin</span>
                  </Link>
              }

                <button onClick={() => {setIsMobileMenuOpen(false);setShowPasswordModal(true);}} className="mobile-pwd-btn">
                  <KeyRound size={18} />
                  <span>Redefinir Senha</span>
                </button>

                <button onClick={onLogout} className="mobile-logout-btn">
                  <LogOut size={18} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      {}
      {showPasswordModal &&
      <div className="modal-overlay" onClick={() => setShowPasswordModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><KeyRound size={20} /> Redefinir Senha</h3>
            
            {pwdSuccess ?
          <p style={{ color: '#16a34a', fontWeight: 'bold', textAlign: 'center' }}>Senha redefinida com sucesso!</p> :

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Senha Atual</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="form-input" placeholder="Sua senha atual" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Nova Senha</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="form-input" placeholder="Mínimo de 6 caracteres" />
                </div>
                
                {pwdError && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{pwdError}</p>}
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)} style={{ flex: 1 }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={pwdLoading} style={{ flex: 1 }}>{pwdLoading ? 'Salvando...' : 'Atualizar Senha'}</button>
                </div>
              </form>
          }
          </div>
        </div>
      }
    </>);

};

export default Navbar;