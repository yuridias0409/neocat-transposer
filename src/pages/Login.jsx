import React, { useState } from 'react';
import { User } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() !== '') {
      localStorage.setItem('salmistasUser', email);
      onLogin(email);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card text-center">
        <div className="icon-wrapper mb-4">
          <User size={48} className="text-primary" />
        </div>
        <h2 className="mb-2">Bem-vindo(a)</h2>
        <p className="mb-4">Digite seu e-mail para carregar seu perfil vocal e suas anotações.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group mb-4">
            <input 
              type="email" 
              className="form-input" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
