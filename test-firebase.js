import { db } from './src/services/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

async function run() {
  const iaRef = doc(db, "ia_song_metrics", "a-cabana-dos-pastores");
  const iaSnap = await getDoc(iaRef);
  console.log("ia_metrics:", iaSnap.exists() ? iaSnap.data() : "NOT FOUND");
  process.exit(0);
}
run();
