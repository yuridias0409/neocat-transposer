import { db } from '../services/firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { cantosData } from '../data';

class CantoDAO {



  getById(id) {
    return cantosData[id] || null;
  }




  getAll() {
    return cantosData;
  }




  async savePitchMetadata(id, dataToSave) {
    const docRef = doc(db, "cantos", id);
    await setDoc(docRef, dataToSave, { merge: true });
  }




  async getPitchMetadata(id) {
    try {
      const docRef = doc(db, "cantos", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }




  async getAllCantosMetadata() {
    try {
      const colRef = collection(db, "cantos");
      const snap = await getDocs(colRef);
      const cantosFirebase = {};
      snap.forEach((doc) => {
        cantosFirebase[doc.id] = doc.data();
      });
      return cantosFirebase;
    } catch (err) {
      console.error(err);
    }
    return {};
  }
}

export default new CantoDAO();