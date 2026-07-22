import React, { useState, useEffect } from 'react';
import AuthDAO from '../../../dao/AuthDAO';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function AdminLogin({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (AuthDAO.isSignInUrl(window.location.href)) {
      setLoading(true);
      AuthDAO.signInWithUrl(window.location.href).
      then((user) => {
        onAuthenticated(user);
      }).
      catch((error) => console.error("Erro na autenticação:", error)).
      finally(() => setLoading(false));
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

  if (loading) return _jsxDEV("div", { children: "Autenticando acesso restrito..." }, void 0, false);

  return (
    _jsxDEV("div", { style: { padding: '2rem', maxWidth: '400px', margin: 'auto', fontFamily: 'var(--font-body)' }, children: [
      _jsxDEV("h2", { children: "Painel Administrativo - Acesso Oculto" }, void 0, false),
      sent ?
      _jsxDEV("p", { children: ["✅ Link de acesso enviado para ", _jsxDEV("strong", { children: email }, void 0, false), ". Abra seu e-mail para entrar."] }, void 0, true) :

      _jsxDEV("form", { onSubmit: handleSendLink, children: [
        _jsxDEV("label", { children: "E-mail Autorizado:" }, void 0, false),
        _jsxDEV("input", {
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true,
          placeholder: "seu-email@dominio.com",
          style: { width: '100%', padding: '8px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc' } }, void 0, false
        ),
        errorMsg && _jsxDEV("p", { style: { color: 'red', fontSize: '0.9rem' }, children: errorMsg }, void 0, false),
        _jsxDEV("button", { className: "btn btn-primary", type: "submit", disabled: loading, style: { padding: '10px 20px', width: '100%' }, children:
          loading ? 'Enviando...' : 'Receber Link de Acesso' }, void 0, false
        )] }, void 0, true
      )] }, void 0, true

    ));

}
export default AdminLogin;