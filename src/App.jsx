import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './views/pages/Dashboard/Dashboard';
import Calibrador from './views/pages/Calibrador/Calibrador';
import Canto from './views/pages/Canto/Canto';
import Login from './views/pages/Login/Login';
import AdminLogin from './views/pages/Admin/AdminLogin';
import AdminDashboard from './views/pages/Admin/AdminDashboard';

import UserDAO from './dao/UserDAO';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function AdminRoute() {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return _jsxDEV("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-body)' }, children: "Carregando painel..." }, void 0, false);
  }

  if (!adminUser) {
    return _jsxDEV(AdminLogin, { onAuthenticated: setAdminUser }, void 0, false);
  }

  return _jsxDEV(AdminDashboard, {}, void 0, false);
}

function MainApp({ user, setUser }) {
  if (!user) {
    return _jsxDEV(Login, { onLogin: setUser }, void 0, false);
  }

  return (
    _jsxDEV("div", { className: "app-container", children: [
      _jsxDEV(Navbar, { user: user, onLogout: () => {UserDAO.clearSession();setUser(null);} }, void 0, false),
      _jsxDEV("main", { children:
        _jsxDEV(Routes, { children: [
          _jsxDEV(Route, { path: "/", element: _jsxDEV(Dashboard, {}, void 0, false) }, void 0, false),
          _jsxDEV(Route, { path: "/calibrador", element: _jsxDEV(Calibrador, { user: user }, void 0, false) }, void 0, false),
          _jsxDEV(Route, { path: "/canto/:id", element: _jsxDEV(Canto, { user: user }, void 0, false) }, void 0, false)] }, void 0, true
        ) }, void 0, false
      )] }, void 0, true
    ));

}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = UserDAO.getCurrentUserEmail();
    if (savedUser) setUser(savedUser);
  }, []);

  return (
    _jsxDEV(Router, { children:
      _jsxDEV(Routes, { children: [

        _jsxDEV(Route, { path: "/admin", element: _jsxDEV(AdminRoute, {}, void 0, false) }, void 0, false),


        _jsxDEV(Route, { path: "/*", element: _jsxDEV(MainApp, { user: user, setUser: setUser }, void 0, false) }, void 0, false)] }, void 0, true
      ) }, void 0, false
    ));

}

export default App;