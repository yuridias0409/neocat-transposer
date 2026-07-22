import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

class UserDAO {
  /**
   * Pega o email logado localmente (session)
   */
  getCurrentUserEmail() {
    return localStorage.getItem('salmistasEmail');
  }

  /**
   * Define o email ativo na sessão
   */
  setCurrentUserEmail(email) {
    if (email) {
      localStorage.setItem('salmistasEmail', email);
    } else {
      localStorage.removeItem('salmistasEmail');
    }
  }

  /**
   * Recupera o perfil do usuário atual a partir do Firestore
   */
  async getProfile(email) {
    if (!email) return null;
    
    try {
      const docRef = doc(db, 'users', email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profile) {
          localStorage.setItem('userVoiceProfile', JSON.stringify(data.profile));
          if (data.calibrationData) {
            localStorage.setItem('calibrationData', JSON.stringify(data.calibrationData));
          }
          return data.profile;
        }
      }
    } catch (err) {
      console.error("Erro ao carregar perfil do Firestore", err);
    }
    
    // Fallback: Tenta pegar o que já tinha antes da nuvem ou do cache
    const savedProfile = localStorage.getItem('userVoiceProfile');
    if (savedProfile) {
      try { return JSON.parse(savedProfile); } catch (e) { return null; }
    }
    return null;
  }

  /**
   * Salva o perfil e os testes do usuário no Firestore
   */
  async saveProfile(email, profileData, fullCalibrationData = null) {
    if (!email) return;
    
    // Salva no LocalStorage como cache rápido
    localStorage.setItem('userVoiceProfile', JSON.stringify(profileData));
    if (fullCalibrationData) {
      localStorage.setItem('calibrationData', JSON.stringify(fullCalibrationData));
    }

    try {
      const docRef = doc(db, 'users', email);
      const dataToSave = { 
        profile: profileData, 
        atualizado_em: new Date().toISOString() 
      };
      if (fullCalibrationData) {
        dataToSave.calibrationData = fullCalibrationData;
      }
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (err) {
      console.error("Erro ao salvar perfil no Firestore", err);
      throw err;
    }
  }

  /**
   * Busca as anotações de um canto específico para o usuário
   */
  async getNote(email, cantoId) {
    if (!email || !cantoId) return '';
    try {
      const noteRef = doc(db, `users/${email}/anotacoes`, cantoId);
      const snap = await getDoc(noteRef);
      if (snap.exists()) {
        return snap.data().texto || '';
      }
    } catch(err) {
      console.error(err);
    }
    // Fallback local
    return localStorage.getItem(`salmistasNotes_${email}_${cantoId}`) || '';
  }

  /**
   * Salva as anotações de um canto específico no Firestore
   */
  async saveNote(email, cantoId, texto) {
    if (!email || !cantoId) return;
    
    localStorage.setItem(`salmistasNotes_${email}_${cantoId}`, texto);
    
    try {
      const noteRef = doc(db, `users/${email}/anotacoes`, cantoId);
      await setDoc(noteRef, { texto, atualizado_em: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Erro ao salvar nota", err);
    }
  }

  /**
   * Apaga a sessão
   */
  clearSession() {
    localStorage.removeItem('salmistasEmail');
    localStorage.removeItem('salmistasUser');
    localStorage.removeItem('userVoiceProfile');
    localStorage.removeItem('calibrationData');
  }
}

export default new UserDAO();
