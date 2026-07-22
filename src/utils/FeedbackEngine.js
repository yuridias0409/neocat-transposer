import { db } from '../services/firebase';
import { doc, updateDoc, increment, setDoc, collection } from 'firebase/firestore';

export async function processarFeedbackEAprender({ userId, cantoId, tipoFeedback, tomAtualSemitons }) {
  if (!userId || !cantoId) return;

  // 1. Registra o log do feedback
  const feedbacksRef = doc(collection(db, "feedbacks_tom"));
  await setDoc(feedbacksRef, {
    user_id: userId,
    canto_id: cantoId,
    feedback_tipo: tipoFeedback,
    semitones_utilizados: tomAtualSemitons,
    timestamp: new Date().toISOString()
  });

  // 2. Atualiza o viés pessoal do usuário
  // Se o usuário reportou "TOO_HIGH", reduzimos o offset_pessoal dele em -1 semitom
  let deltaOffsetUsuario = 0;
  if (tipoFeedback === 'TOO_HIGH') deltaOffsetUsuario = -1;
  if (tipoFeedback === 'TOO_LOW') deltaOffsetUsuario = 1;

  if (deltaOffsetUsuario !== 0) {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      profile: {
        preferencias_tom: {
          offset_pessoal_semitones: increment(deltaOffsetUsuario),
          total_feedbacks: increment(1)
        }
      }
    }, { merge: true });
    
    // Atualiza cache local
    try {
      const localProfile = JSON.parse(localStorage.getItem('userVoiceProfile'));
      if (localProfile) {
        if (!localProfile.preferencias_tom) localProfile.preferencias_tom = { offset_pessoal_semitones: 0, total_feedbacks: 0 };
        localProfile.preferencias_tom.offset_pessoal_semitones += deltaOffsetUsuario;
        localProfile.preferencias_tom.total_feedbacks += 1;
        localStorage.setItem('userVoiceProfile', JSON.stringify(localProfile));
      }
    } catch(e) {}
  }

  // 3. Atualiza os contadores agregados do canto
  const cantoRef = doc(db, "cantos", cantoId);
  const updateDataCanto = {
    metricas_feedback: {
      total_avaliacoes: increment(1)
    }
  };

  if (tipoFeedback === 'OPTIMAL') updateDataCanto.metricas_feedback.qtd_otimo = increment(1);
  if (tipoFeedback === 'TOO_HIGH') updateDataCanto.metricas_feedback.qtd_alto_demais = increment(1);
  if (tipoFeedback === 'TOO_LOW') updateDataCanto.metricas_feedback.qtd_baixo_demais = increment(1);

  // setDoc com merge garante que se o canto ainda não existir no Firestore, ele será criado
  await setDoc(cantoRef, updateDataCanto, { merge: true });
}
