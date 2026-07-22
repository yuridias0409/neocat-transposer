import React, { useState } from 'react';
import { User } from 'lucide-react';
import UserDAO from '../../../dao/UserDAO';
import { useNavigate } from 'react-router-dom';
import './Login.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim() !== '') {
      setLoading(true);
      const emailLower = email.toLowerCase().trim();


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
    }
  };

  return (
    _jsxDEV("div", { className: "login-container", children:
      _jsxDEV("div", { className: "login-card card text-center", children: [
        _jsxDEV("div", { className: "icon-wrapper mb-4", children:
          _jsxDEV(User, { size: 48, className: "text-primary" }, void 0, false) }, void 0, false
        ),
        _jsxDEV("h2", { className: "mb-2", children: "Bem-vindo(a)" }, void 0, false),
        _jsxDEV("p", { className: "mb-4", children: "Digite seu e-mail para carregar seu perfil vocal e suas anotações." }, void 0, false),

        _jsxDEV("form", { onSubmit: handleSubmit, children: [
          _jsxDEV("div", { className: "input-group mb-4", children:
            _jsxDEV("input", {
              type: "email",
              className: "form-input",
              placeholder: "seu@email.com",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              required: true }, void 0, false
            ) }, void 0, false
          ),
          _jsxDEV("button", { type: "submit", className: "btn btn-primary w-100", disabled: loading, children:
            loading ? 'Carregando...' : 'Entrar' }, void 0, false
          )] }, void 0, true
        )] }, void 0, true
      ) }, void 0, false
    ));

};

export default Login;