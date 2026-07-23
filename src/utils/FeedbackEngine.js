import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, increment, setDoc, collection } from 'firebase/firestore';
import { hzToNoteName } from './musicMath';

export async function processarFeedbackEAprender({ userId, cantoId, tipoFeedback, tomAtualSemitons }) {
  if (!userId || !cantoId) return { success: false, requireRecalibration: false };

  let requireRecalibration = false;

  const feedbacksRef = doc(collection(db, "feedbacks_tom"));
  const encodedUserId = btoa(userId);

  await setDoc(feedbacksRef, {
    user_id: encodedUserId,
    canto_id: cantoId,
    feedback_tipo: tipoFeedback,
    semitones_utilizados: tomAtualSemitons,
    timestamp: new Date().toISOString()
  });

  const cantoRef = doc(db, "cantos", cantoId);
  const cantoSnap = await getDoc(cantoRef);
  let cantoData = cantoSnap.exists() ? cantoSnap.data() : null;

  const userRef = doc(db, "users", encodedUserId);
  const userSnap = await getDoc(userRef);
  let userData = userSnap.exists() ? userSnap.data() : { profile: {} };
  let profile = userData.profile || {};
  let f0_min = profile.f0_min || 82.41;
  let f0_max = profile.f0_max || 329.63;
  let cantosValidados = profile.cantos_validados || {};
  let totalErrosContínuos = profile.feedbacks_negativos_consecutivos || 0;
  let comfortMap = profile.comfort_map || {};

  if (tipoFeedback !== 'OPTIMAL') {
    totalErrosContínuos += 1;

    if (tipoFeedback === 'TOO_HIGH') {
      f0_max = f0_max * 0.95;
    } else if (tipoFeedback === 'TOO_LOW') {
      f0_min = f0_min * 1.05;
    }

    if (totalErrosContínuos >= 5) {
      requireRecalibration = true;
    }
  } else {
    totalErrosContínuos = 0;
    cantosValidados[cantoId] = tomAtualSemitons;

    let outlierAgudoCount = profile.outlier_agudo_count || 0;
    let outlierGraveCount = profile.outlier_grave_count || 0;

    if (cantoData && cantoData.freq_max_curada && cantoData.freq_min_curada) {
      const freqMaxReal = cantoData.freq_max_curada * Math.pow(2, tomAtualSemitons / 12);
      const freqMinReal = cantoData.freq_min_curada * Math.pow(2, tomAtualSemitons / 12);

      if (freqMaxReal > f0_max) {
        outlierAgudoCount += 1;
        if (outlierAgudoCount >= 3) {
          f0_max = (f0_max + freqMaxReal) / 2;
          outlierAgudoCount = 0; 
        }
      } else {
        outlierAgudoCount = 0; 
      }

      if (freqMinReal < f0_min) {
        outlierGraveCount += 1;
        if (outlierGraveCount >= 3) {
          f0_min = (f0_min + freqMinReal) / 2;
          outlierGraveCount = 0;
        }
      } else {
        outlierGraveCount = 0;
      }
    }

    profile.outlier_agudo_count = outlierAgudoCount;
    profile.outlier_grave_count = outlierGraveCount;

    if (cantoData && cantoData.freq_max_curada && cantoData.freq_min_curada) {
      const freqMaxReal = cantoData.freq_max_curada * Math.pow(2, tomAtualSemitons / 12);
      const freqMinReal = cantoData.freq_min_curada * Math.pow(2, tomAtualSemitons / 12);

            const maxNote = hzToNoteName(freqMaxReal);
      const minNote = hzToNoteName(freqMinReal);

      if (maxNote && maxNote !== "--") comfortMap[maxNote] = (comfortMap[maxNote] || 0) + 1;
      if (minNote && minNote !== "--") comfortMap[minNote] = (comfortMap[minNote] || 0) + 1;
    }

    if (profile.tipoVoz) {
      const iaSongRef = doc(db, "ia_song_metrics", cantoId);
      await setDoc(iaSongRef, {
        [profile.tipoVoz]: {
          [tomAtualSemitons.toString()]: increment(1)
        }
      }, { merge: true });
    }
  }

  const userUpdate = {
    "profile.f0_min": parseFloat(f0_min.toFixed(2)),
    "profile.f0_max": parseFloat(f0_max.toFixed(2)),
    "profile.cantos_validados": cantosValidados,
    "profile.feedbacks_negativos_consecutivos": totalErrosContínuos,
    "profile.comfort_map": comfortMap
  };
  await updateDoc(userRef, userUpdate);

  try {
    const localProfile = JSON.parse(localStorage.getItem('userVoiceProfile')) || {};
    localProfile.f0_min = parseFloat(f0_min.toFixed(2));
    localProfile.f0_max = parseFloat(f0_max.toFixed(2));
    localProfile.cantos_validados = cantosValidados;
    localProfile.feedbacks_negativos_consecutivos = totalErrosContínuos;
    localProfile.comfort_map = comfortMap;
    localStorage.setItem('userVoiceProfile', JSON.stringify(localProfile));
  } catch (e) {}

  if (cantoData) {
    let metricas = cantoData.metricas_feedback || { qtd_otimo: 0, qtd_alto_demais: 0, qtd_baixo_demais: 0, total_avaliacoes: 0 };

        metricas.total_avaliacoes += 1;
    if (tipoFeedback === 'OPTIMAL') metricas.qtd_otimo += 1;
    if (tipoFeedback === 'TOO_HIGH') metricas.qtd_alto_demais += 1;
    if (tipoFeedback === 'TOO_LOW') metricas.qtd_baixo_demais += 1;

    let updates = { metricas_feedback: metricas };

    if (metricas.qtd_alto_demais >= 20) {
      if (cantoData.freq_max_curada) updates.freq_max_curada = parseFloat((cantoData.freq_max_curada * Math.pow(2, -1/12)).toFixed(2));
      if (cantoData.freq_min_curada) updates.freq_min_curada = parseFloat((cantoData.freq_min_curada * Math.pow(2, -1/12)).toFixed(2));
      if (cantoData.freq_max_povo_curada) updates.freq_max_povo_curada = parseFloat((cantoData.freq_max_povo_curada * Math.pow(2, -1/12)).toFixed(2));
      if (cantoData.freq_min_povo_curada) updates.freq_min_povo_curada = parseFloat((cantoData.freq_min_povo_curada * Math.pow(2, -1/12)).toFixed(2));
      updates.metricas_feedback.qtd_alto_demais = 0;
    }

        if (metricas.qtd_baixo_demais >= 20) {
      if (cantoData.freq_max_curada) updates.freq_max_curada = parseFloat((cantoData.freq_max_curada * Math.pow(2, 1/12)).toFixed(2));
      if (cantoData.freq_min_curada) updates.freq_min_curada = parseFloat((cantoData.freq_min_curada * Math.pow(2, 1/12)).toFixed(2));
      if (cantoData.freq_max_povo_curada) updates.freq_max_povo_curada = parseFloat((cantoData.freq_max_povo_curada * Math.pow(2, 1/12)).toFixed(2));
      if (cantoData.freq_min_povo_curada) updates.freq_min_povo_curada = parseFloat((cantoData.freq_min_povo_curada * Math.pow(2, 1/12)).toFixed(2));
      updates.metricas_feedback.qtd_baixo_demais = 0;
    }

    await setDoc(cantoRef, updates, { merge: true });
  } else {
    let metricas = { qtd_otimo: 0, qtd_alto_demais: 0, qtd_baixo_demais: 0, total_avaliacoes: 1 };
    if (tipoFeedback === 'OPTIMAL') metricas.qtd_otimo = 1;
    if (tipoFeedback === 'TOO_HIGH') metricas.qtd_alto_demais = 1;
    if (tipoFeedback === 'TOO_LOW') metricas.qtd_baixo_demais = 1;
    await setDoc(cantoRef, { metricas_feedback: metricas }, { merge: true });
  }

  return { success: true, requireRecalibration };
}