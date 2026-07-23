import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './views/pages/Dashboard/Dashboard';
import Calibrador from './views/pages/Calibrador/Calibrador';
import Canto from './views/pages/Canto/Canto';
import Login from './views/pages/Login/Login';
import AdminDashboard from './views/pages/Admin/AdminDashboard';
import { InstallPrompt } from './views/components/InstallPrompt';

import UserDAO from './dao/UserDAO';
import AuthDAO from './dao/AuthDAO';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function AdminRoute({ user }) {
  if (!user || !AuthDAO.isAdmin(user)) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-body)' }}>Acesso negado. Apenas administradores autorizados.</div>;
  }
  return <AdminDashboard />;
}

function MainApp({ user, setUser }) {
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={async () => { await AuthDAO.logout(); UserDAO.clearSession(); setUser(null); }} />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calibrador" element={<Calibrador user={user} />} />
          <Route path="/canto/:id" element={<Canto user={user} />} />
          <Route path="/admin" element={<AdminRoute user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <InstallPrompt />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Escuta mudanças no estado de autenticação do Firebase para todos os usuários
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        UserDAO.setCurrentUserEmail(firebaseUser.email);
        await UserDAO.getProfile(firebaseUser.email); // Busca e migra o perfil ANTES de renderizar as rotas internas
        setUser(firebaseUser.email);
      } else {
        // Fallback para sessão antiga/local, se existir (para não deslogar quem acabou de abrir o app após a atualização)
        const savedUser = UserDAO.getCurrentUserEmail();
        if (savedUser) {
          await UserDAO.getProfile(savedUser);
          setUser(savedUser);
        }
        else setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  return (
    <Router>
      <MainApp user={user} setUser={setUser} />
    </Router>
  );
}

export default App;