import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
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
}

export default new CantoDAO();
