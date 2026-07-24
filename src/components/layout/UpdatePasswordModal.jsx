import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import AuthDAO from "../../api/AuthDAO";

export default function UpdatePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);
    if (!currentPassword || !newPassword) {
      setPwdError("Preencha as duas senhas.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setPwdLoading(true);
    try {
      await AuthDAO.updateUserPassword(currentPassword, newPassword);
      setPwdSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error(error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setPwdError("A senha atual está incorreta.");
      } else {
        setPwdError("Erro ao redefinir a senha.");
      }
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
        }}
      >
        <h3
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <KeyRound size={20} /> Redefinir Senha
        </h3>

        {pwdSuccess ? (
          <p
            style={{
              color: "#16a34a",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Senha redefinida com sucesso!
          </p>
        ) : (
          <form
            onSubmit={handleUpdatePassword}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                }}
              >
                Senha Atual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="form-input"
                placeholder="Sua senha atual"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                }}
              >
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="form-input"
                placeholder="Mínimo de 6 caracteres"
              />
            </div>

            {pwdError && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "0.85rem",
                }}
              >
                {pwdError}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                style={{
                  flex: 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwdLoading}
                style={{
                  flex: 1,
                }}
              >
                {pwdLoading ? "Salvando..." : "Atualizar Senha"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
