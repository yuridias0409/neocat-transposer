import { db } from './src/services/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

async function run() {
  const ref = doc(db, "cantos", "a-cabana-dos-pastores");
  const snap = await getDoc(ref);
  console.log("cantos doc:", snap.exists() ? snap.data() : "NOT FOUND");
  process.exit(0);
}
run();
