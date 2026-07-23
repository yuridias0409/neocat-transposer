import { auth } from '../services/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

class AuthDAO {

  ALLOWED_ADMINS = [
    'yuri.dias0409@hotmail.com'
  ];

  isAdmin(email) {
    if (!email) return false;
    return this.ALLOWED_ADMINS.includes(email.toLowerCase().trim());
  }

  async loginWithPassword(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Tenta criar a conta automaticamente se não existir e as credenciais forem "inválidas" ou "não encontradas"
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          return newUserCredential.user;
        } catch (registerError) {
          throw registerError;
        }
      }
      throw error;
    }
  }

  async sendMagicLink(email) {
    const actionCodeSettings = {
      url: window.location.origin, // Redireciona para o root após o login mágico
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  }

  async sendPasswordReset(email) {
    await sendPasswordResetEmail(auth, email);
  }

  async updateUserPassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não está logado.");
    
    // Reautenticar o usuário antes de alterar a senha (exigência do Firebase)
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Atualizar a senha
    await updatePassword(user, newPassword);
  }

  isSignInUrl(url) {
    return isSignInWithEmailLink(auth, url);
  }

  async signInWithUrl(url) {
    let emailForSignIn = window.localStorage.getItem('emailForSignIn');
    if (!emailForSignIn) {
      emailForSignIn = window.prompt('Por favor, confirme seu e-mail para concluir o login:');
    }
    const result = await signInWithEmailLink(auth, emailForSignIn, url);
    window.localStorage.removeItem('emailForSignIn');
    return result.user;
  }

  async logout() {
    await signOut(auth);
  }
}

export default new AuthDAO();