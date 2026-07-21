import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mic2, LogOut, User } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <BookOpen size={24} />
          <span>Salmistas</span>
        </Link>
        
        <div className="navbar-links">
          <Link to="/" className="nav-link">Cantos</Link>
          <Link to="/calibrador" className="btn btn-secondary btn-sm">
            <Mic2 size={16} />
            <span>Calibrar Voz</span>
          </Link>
          
          {user && (
            <div className="user-menu" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid #ccc', paddingLeft: '1rem'}}>
              <User size={16} className="text-primary" />
              <span style={{fontSize: '0.85rem', color: '#666'}}>{user.split('@')[0]}</span>
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
