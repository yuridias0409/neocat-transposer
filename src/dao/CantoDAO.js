import { db } from '../services/firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { cantosData } from '../data';

class CantoDAO {
  /**
   * Pega um canto pelo ID do arquivo estático
   */
  getById(id) {
    return cantosData[id] || null;
  }

  /**
   * Retorna todos os cantos
   */
  getAll() {
    return cantosData;
  }

  /**
   * Salva os metadados de frequência no Firebase Firestore
   */
  async savePitchMetadata(id, dataToSave) {
    const docRef = doc(db, "cantos", id);
    await setDoc(docRef, dataToSave, { merge: true });
  }

  /**
   * Busca os metadados agregados do canto (para machine learning)
   */
  async getPitchMetadata(id) {
    try {
      const docRef = doc(db, "cantos", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch(err) {
      console.error(err);
    }
    return null;
  }

  /**
   * Retorna todos os metadados de cantos do Firestore (para o Admin)
   */
  async getAllCantosMetadata() {
    try {
      const colRef = collection(db, "cantos");
      const snap = await getDocs(colRef);
      const cantosFirebase = {};
      snap.forEach(doc => {
        cantosFirebase[doc.id] = doc.data();
      });
      return cantosFirebase;
    } catch(err) {
      console.error(err);
    }
    return {};
  }
}

export default new CantoDAO();
