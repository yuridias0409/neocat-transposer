import { db } from "../services/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { cantosData } from "../data";
class CantoDAO {
  getById(id) {
    return cantosData[id] || null;
  }
  getAll() {
    return cantosData;
  }
  async savePitchMetadata(id, dataToSave) {
    const docRef = doc(db, "cantos", id);
    await setDoc(docRef, dataToSave, {
      merge: true,
    });
  }
  async getPitchMetadata(id) {
    try {
      const docRef = doc(db, "cantos", id);
      const snap = await getDoc(docRef);
      const iaRef = doc(db, "ia_song_metrics", id);
      const iaSnap = await getDoc(iaRef);
      if (snap.exists()) {
        const data = snap.data();
        if (iaSnap.exists()) {
          data.ia_metrics = iaSnap.data();
        }
        return data;
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
  async getAllIntelligentData() {
    try {
      const cantosCol = collection(db, "cantos");
      const iaCol = collection(db, "ia_song_metrics");
      const [cantosSnap, iaSnap] = await Promise.all([
        getDocs(cantosCol),
        getDocs(iaCol),
      ]);
      const combinedData = {};
      cantosSnap.forEach((doc) => {
        combinedData[doc.id] = doc.data();
      });
      iaSnap.forEach((doc) => {
        if (!combinedData[doc.id]) combinedData[doc.id] = {};
        combinedData[doc.id].ia_metrics = doc.data();
      });
      return combinedData;
    } catch (err) {
      console.error(err);
    }
    return {};
  }
}
export default new CantoDAO();
