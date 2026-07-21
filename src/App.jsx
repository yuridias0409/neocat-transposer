import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Calibrador from './pages/Calibrador';
import Canto from './pages/Canto';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('salmistasUser');
    if (savedUser) setUser(savedUser);
  }, []);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={() => { localStorage.removeItem('salmistasUser'); setUser(null); }} />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calibrador" element={<Calibrador />} />
            <Route path="/canto/:id" element={<Canto user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
