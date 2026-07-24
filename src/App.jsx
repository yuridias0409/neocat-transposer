import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import { InstallPrompt } from "./views/components/InstallPrompt";

import Dashboard from "./features/dashboard/Dashboard";
const Calibrador = lazy(() => import("./features/calibrador/Calibrador"));
const Canto = lazy(() => import("./features/canto/Canto"));
const Login = lazy(() => import("./features/auth/Login"));
const AdminDashboard = lazy(() => import("./features/admin/AdminDashboard"));
import UserDAO from "./api/UserDAO";
import AuthDAO from "./api/AuthDAO";
import { auth } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";
function AdminRoute({ isAdmin }) {
  if (!isAdmin) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "var(--font-body)",
        }}
      >
        Acesso negado. Apenas administradores autorizados.
      </div>
    );
  }
  return <AdminDashboard />;
}
const Fallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#666" }}>
    Carregando tela...
  </div>
);

function MainApp({ user, setUser, isAdmin }) {
  if (!user) {
    return (
      <Suspense fallback={<Fallback />}>
        <Login onLogin={setUser} />
      </Suspense>
    );
  }
  return (
    <div className="app-container">
      <Navbar
        user={user}
        isAdmin={isAdmin}
        onLogout={async () => {
          UserDAO.clearSession();
          setUser(null);
          await AuthDAO.logout();
        }}
      />
      <main>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calibrador" element={<Calibrador user={user} />} />
            <Route path="/canto/:id" element={<Canto user={user} />} />
            <Route path="/admin" element={<AdminRoute isAdmin={isAdmin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <InstallPrompt />
    </div>
  );
}
function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      let finalUser = null;
      let finalIsAdmin = false;
      if (firebaseUser) {
        UserDAO.setCurrentUserEmail(firebaseUser.email);
        await UserDAO.getProfile(firebaseUser.email);
        finalIsAdmin = await AuthDAO.isAdmin(firebaseUser.email);
        finalUser = firebaseUser.email;
      } else {
        const savedUser = UserDAO.getCurrentUserEmail();
        if (savedUser) {
          await UserDAO.getProfile(savedUser);
          finalIsAdmin = await AuthDAO.isAdmin(savedUser);
          finalUser = savedUser;
        }
      }
      setIsAdmin(finalIsAdmin);
      setUser(finalUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Carregando...
      </div>
    );
  }
  return (
    <Router>
      <MainApp user={user} setUser={setUser} isAdmin={isAdmin} />
    </Router>
  );
}
export default App;
