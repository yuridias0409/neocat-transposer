import React, { useState, useEffect } from 'react';
import { auth } from '../../../services/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export function AdminLogin({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Confirme seu e-mail para concluir o acesso admin:');
      }
      setLoading(true);
      signInWithEmailLink(auth, emailForSignIn, window.location.href)
        .then((result) => {
          window.localStorage.removeItem('emailForSignIn');
          onAuthenticated(result.user);
        })
        .catch((error) => console.error("Erro na autenticação:", error))
        .finally(() => setLoading(false));
    }
  }, [onAuthenticated]);

  const handleSendLink = async (e) => {
    e.preventDefault();
    const actionCodeSettings = {
      url: `${window.location.origin}/admin`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSent(true);
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
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
          <button className="btn btn-primary" type="submit" style={{ padding: '10px 20px', width: '100%' }}>Receber Link de Acesso</button>
        </form>
      )}
    </div>
  );
}
export default AdminLogin;
