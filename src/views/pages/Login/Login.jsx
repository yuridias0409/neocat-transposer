import React, { useState } from 'react';
import { User } from 'lucide-react';
import UserDAO from '../../../dao/UserDAO';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim() !== '') {
      setLoading(true);
      const emailLower = email.toLowerCase().trim();
      
      // Define a sessão local
      UserDAO.setCurrentUserEmail(emailLower);
      
      // Busca no Firebase
      const profile = await UserDAO.getProfile(emailLower);
      
      // Se não achou perfil na nuvem, garante que não fique lixo de outro user no cache
      if (!profile) {
        localStorage.removeItem('userVoiceProfile');
        localStorage.removeItem('calibrationData');
      }

      // Chama o hook onLogin para atualizar o App
      onLogin(emailLower);
      
      if (!profile) {
        navigate('/calibrador');
      } else {
        navigate('/');
      }
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
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
