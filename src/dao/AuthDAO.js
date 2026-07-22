import { auth } from '../services/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut } from 'firebase/auth';

class AuthDAO {
  // Lista de emails que podem acessar o admin
  ALLOWED_ADMINS = [
    'yuri.dias0409@hotmail.com'
  ];

  async sendMagicLink(email) {
    if (!this.ALLOWED_ADMINS.includes(email)) {
      throw new Error('Acesso negado. Seu e-mail não está na lista de administradores autorizados.');
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/admin`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  }

  isSignInUrl(url) {
    return isSignInWithEmailLink(auth, url);
  }

  async signInWithUrl(url) {
    let emailForSignIn = window.localStorage.getItem('emailForSignIn');
    if (!emailForSignIn) {
      emailForSignIn = window.prompt('Confirme seu e-mail para concluir o acesso admin:');
    }
    const result = await signInWithEmailLink(auth, emailForSignIn, url);
    window.localStorage.removeItem('emailForSignIn');
    return result.user;
  }

  async logoutAdmin() {
    await signOut(auth);
  }
}

export default new AuthDAO();
