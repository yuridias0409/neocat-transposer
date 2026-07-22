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
import { onAuthStateChanged } from 'firebase/auth';

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
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-body)'}}>Carregando painel...</div>;
  }
  
  if (!adminUser) {
    return <AdminLogin onAuthenticated={setAdminUser} />;
  }
  
  return <AdminDashboard />;
}

function MainApp({ user, setUser }) {
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={() => { UserDAO.clearSession(); setUser(null); }} />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calibrador" element={<Calibrador user={user} />} />
          <Route path="/canto/:id" element={<Canto user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = UserDAO.getCurrentUserEmail();
    if (savedUser) setUser(savedUser);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Rota oculta de admin */}
        <Route path="/admin" element={<AdminRoute />} />
        
        {/* App normal de salmistas */}
        <Route path="/*" element={<MainApp user={user} setUser={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;
