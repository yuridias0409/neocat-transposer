import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

class UserDAO {



  getCurrentUserEmail() {
    return localStorage.getItem('salmistasEmail');
  }




  setCurrentUserEmail(email) {
    if (email) {
      localStorage.setItem('salmistasEmail', email);
    } else {
      localStorage.removeItem('salmistasEmail');
    }
  }




  async getProfile(email) {
    if (!email) return null;
    const encodedEmail = btoa(email);

    try {
      const docRef = doc(db, 'users', encodedEmail);
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
      } else {
        // Migração LGPD: Buscar documento antigo (e-mail aberto)
        const oldDocRef = doc(db, 'users', email);
        const oldDocSnap = await getDoc(oldDocRef);
        if (oldDocSnap.exists()) {
          const oldData = oldDocSnap.data();
          // Salva no novo local codificado
          await setDoc(docRef, oldData);
          
          if (oldData.profile) {
            localStorage.setItem('userVoiceProfile', JSON.stringify(oldData.profile));
            if (oldData.calibrationData) {
              localStorage.setItem('calibrationData', JSON.stringify(oldData.calibrationData));
            }
            return oldData.profile;
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar perfil do Firestore", err);
    }


    const savedProfile = localStorage.getItem('userVoiceProfile');
    if (savedProfile) {
      try {return JSON.parse(savedProfile);} catch (e) {return null;}
    }
    return null;
  }




  async saveProfile(email, profileData, fullCalibrationData = undefined) {
    if (!email) return;
    const encodedEmail = btoa(email);

    if (profileData) {
      let existing = {};
      try {
        const raw = localStorage.getItem('userVoiceProfile');
        if (raw) existing = JSON.parse(raw);
      } catch (e) {}
      localStorage.setItem('userVoiceProfile', JSON.stringify({ ...existing, ...profileData }));
    } else {
      localStorage.removeItem('userVoiceProfile');
    }

    if (fullCalibrationData !== undefined) {
      if (fullCalibrationData) {
        localStorage.setItem('calibrationData', JSON.stringify(fullCalibrationData));
      } else {
        localStorage.removeItem('calibrationData');
      }
    }

    try {
      const docRef = doc(db, 'users', encodedEmail);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const dataToUpdate = {
          atualizado_em: new Date().toISOString()
        };
        
        if (profileData) {
          for (const [key, value] of Object.entries(profileData)) {
            dataToUpdate[`profile.${key}`] = value;
          }
        } else {
          dataToUpdate.profile = null;
        }
        
        if (fullCalibrationData !== undefined) {
          dataToUpdate.calibrationData = fullCalibrationData;
        }
        
        await updateDoc(docRef, dataToUpdate);
      } else {
        const dataToSave = {
          profile: profileData,
          atualizado_em: new Date().toISOString()
        };
        if (fullCalibrationData !== undefined) {
          dataToSave.calibrationData = fullCalibrationData;
        }
        await setDoc(docRef, dataToSave);
      }
    } catch (err) {
      console.error("Erro ao salvar perfil no Firestore", err);
      throw err;
    }
  }




  async getNote(email, cantoId) {
    if (!email || !cantoId) return '';
    const encodedEmail = btoa(email);
    
    try {
      const noteRef = doc(db, `users/${encodedEmail}/anotacoes`, cantoId);
      const snap = await getDoc(noteRef);
      if (snap.exists()) {
        return snap.data().texto || '';
      } else {
        // Migração LGPD
        const oldNoteRef = doc(db, `users/${email}/anotacoes`, cantoId);
        const oldSnap = await getDoc(oldNoteRef);
        if (oldSnap.exists()) {
          const oldData = oldSnap.data();
          await setDoc(noteRef, oldData);
          return oldData.texto || '';
        }
      }
    } catch (err) {
      console.error(err);
    }

    return localStorage.getItem(`salmistasNotes_${email}_${cantoId}`) || '';
  }




  async saveNote(email, cantoId, texto) {
    if (!email || !cantoId) return;
    const encodedEmail = btoa(email);

    localStorage.setItem(`salmistasNotes_${email}_${cantoId}`, texto);

    try {
      const noteRef = doc(db, `users/${encodedEmail}/anotacoes`, cantoId);
      await setDoc(noteRef, { texto, atualizado_em: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Erro ao salvar nota", err);
    }
  }




  clearSession() {
    localStorage.removeItem('salmistasEmail');
    localStorage.removeItem('salmistasUser');
    localStorage.removeItem('userVoiceProfile');
    localStorage.removeItem('calibrationData');
  }
}

export default new UserDAO();