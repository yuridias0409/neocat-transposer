import React, { useState, useEffect } from 'react';
import AuthDAO from '../../../dao/AuthDAO';

export function AdminLogin({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (AuthDAO.isSignInUrl(window.location.href)) {
      setLoading(true);
      AuthDAO.signInWithUrl(window.location.href)
        .then((user) => {
          onAuthenticated(user);
        })
        .catch((error) => console.error("Erro na autenticação:", error))
        .finally(() => setLoading(false));
    }
  }, [onAuthenticated]);

  const handleSendLink = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await AuthDAO.sendMagicLink(email);
      setSent(true);
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Autenticando acesso restrito...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto', fontFamily: 'var(--font-body)' }}>
      <h2>Painel Administrativo - Acesso Oculto</h2>
      {sent ? (
        <p>✅ Link de acesso enviado para <strong>{email}</strong>. Abra seu e-mail para entrar.</p>
      ) : (
        <form onSubmit={handleSendLink}>
          <label>E-mail Autorizado:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="seu-email@dominio.com"
            style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          {errorMsg && <p style={{color: 'red', fontSize: '0.9rem'}}>{errorMsg}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '10px 20px', width: '100%' }}>
            {loading ? 'Enviando...' : 'Receber Link de Acesso'}
          </button>
        </form>
      )}
    </div>
  );
}
export default AdminLogin;
