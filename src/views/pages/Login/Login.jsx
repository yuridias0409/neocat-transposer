import React, { useState, useEffect } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import UserDAO from '../../../dao/UserDAO';
import AuthDAO from '../../../dao/AuthDAO';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (AuthDAO.isSignInUrl(window.location.href)) {
      setLoading(true);
      AuthDAO.signInWithUrl(window.location.href)
        .then((user) => {
          proceedWithLogin(user.email);
        })
        .catch((error) => {
          console.error("Erro na autenticação:", error);
          setErrorMsg("Link de acesso inválido ou expirado.");
          setLoading(false);
        });
    }
  }, []);

  const proceedWithLogin = async (emailLower) => {
    UserDAO.setCurrentUserEmail(emailLower);
    const profile = await UserDAO.getProfile(emailLower);

    if (!profile) {
      localStorage.removeItem('userVoiceProfile');
      localStorage.removeItem('calibrationData');
    }

    onLogin(emailLower);

    if (!profile) {
      navigate('/calibrador');
    } else {
      navigate('/');
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (email.trim() !== '' && password.trim() !== '') {
      setLoading(true);
      const emailLower = email.toLowerCase().trim();

      try {
        await AuthDAO.loginWithPassword(emailLower, password);
        await proceedWithLogin(emailLower);
      } catch (error) {
        console.error("Login/Register error:", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setErrorMsg('Senha incorreta. Se você nunca definiu uma senha, use o acesso sem senha.');
        } else if (error.code === 'auth/email-already-in-use') {
          setErrorMsg('Este e-mail já possui uma conta (provavelmente você logava via link). Use o "Acesso sem senha" uma vez para entrar e, se desejar, defina uma senha depois.');
        } else if (error.code === 'auth/weak-password') {
          setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.code === 'auth/operation-not-allowed') {
          setErrorMsg('O login com senha está desativado no painel do Firebase. Ative-o em Authentication -> Sign-in method.');
        } else {
          setErrorMsg(`Erro: ${error.message} (${error.code})`);
        }
        setLoading(false);
      }
    }
  };

  const handleMagicLink = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Por favor, digite seu e-mail no campo acima para receber o link.');
      return;
    }
    setLoading(true);
    const emailLower = email.toLowerCase().trim();
    try {
      await AuthDAO.sendMagicLink(emailLower);
      setMagicLinkSent(true);
    } catch (error) {
      console.error(error);
      setErrorMsg('Erro ao enviar link mágico.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Por favor, digite seu e-mail para enviarmos o link de criação de senha.');
      return;
    }
    setLoading(true);
    try {
      await AuthDAO.sendPasswordReset(email.trim().toLowerCase());
      setMagicLinkSent(true);
      setErrorMsg('');
    } catch (error) {
      console.error(error);
      setErrorMsg('Erro ao tentar enviar o e-mail de redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card text-center">
        <div className="icon-wrapper mb-4" style={{ background: 'transparent' }}>
          <img src="/new-icon-without-background.png" alt="Tom do Salmista" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
        </div>
        <h2 className="mb-2">Bem-vindo(a)</h2>
        
        {magicLinkSent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p className="mb-4 text-success" style={{ color: '#16a34a' }}>✅ Um link foi enviado para <strong>{email}</strong>. Verifique seu e-mail e clique nele para entrar ou criar sua senha!</p>
            <button className="btn btn-outline" onClick={() => setMagicLinkSent(false)}>Voltar ao Login</button>
          </div>
        ) : (
          <>
            <p className="mb-4">Entre com sua conta ou criaremos uma automaticamente para você.</p>
            <form onSubmit={handlePasswordLogin}>
              <div className="input-group mb-3">
                <input
                  type="email"
                  className="form-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group mb-3">
                <input
                  type="password"
                  className="form-input"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {errorMsg && <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem' }}>{errorMsg}</p>}
              
              <button type="submit" className="btn btn-primary w-100" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <KeyRound size={18} /> {loading ? 'Entrando...' : 'Entrar com Senha'}
              </button>
            </form>

            <button type="button" onClick={handlePasswordReset} disabled={loading} style={{ background: 'none', border: 'none', color: '#0369a1', fontSize: '0.85rem', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Esqueceu a senha ou quer criar uma agora?
            </button>
            
            <div style={{ margin: '1.2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>ou</div>
            
            <button type="button" className="btn btn-outline w-100" onClick={handleMagicLink} disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} /> Receber Link de Acesso sem Senha
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;