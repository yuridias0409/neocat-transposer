import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, increment, setDoc, collection } from 'firebase/firestore';

export async function processarFeedbackEAprender({ userId, cantoId, tipoFeedback, tomAtualSemitons }) {
  if (!userId || !cantoId) return { success: false, requireRecalibration: false };

  let requireRecalibration = false;

  // 1. Salvar o log bruto de feedback
  const feedbacksRef = doc(collection(db, "feedbacks_tom"));
  await setDoc(feedbacksRef, {
    user_id: userId,
    canto_id: cantoId,
    feedback_tipo: tipoFeedback,
    semitones_utilizados: tomAtualSemitons,
    timestamp: new Date().toISOString()
  });

  // 2. Fetch dados do canto e do usuário
  const cantoRef = doc(db, "cantos", cantoId);
  const cantoSnap = await getDoc(cantoRef);
  let cantoData = cantoSnap.exists() ? cantoSnap.data() : null;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  let userData = userSnap.exists() ? userSnap.data() : { profile: {} };
  let profile = userData.profile || {};
  let f0_min = profile.f0_min || 82.41;
  let f0_max = profile.f0_max || 329.63;
  let cantosValidados = profile.cantos_validados || {};
  let totalErrosContínuos = profile.feedbacks_negativos_consecutivos || 0;

  // 3. Aprendizado Pessoal e Memória de Repertório
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
    // É Ótimo! Zera erros e salva na memória de repertório
    totalErrosContínuos = 0;
    cantosValidados[cantoId] = tomAtualSemitons;

    let outlierAgudoCount = profile.outlier_agudo_count || 0;
    let outlierGraveCount = profile.outlier_grave_count || 0;

    // Calibração Positiva Contínua (Robust ML)
    if (cantoData && cantoData.freq_max_curada && cantoData.freq_min_curada) {
      const freqMaxReal = cantoData.freq_max_curada * Math.pow(2, tomAtualSemitons / 12);
      const freqMinReal = cantoData.freq_min_curada * Math.pow(2, tomAtualSemitons / 12);
      
      // Filtro de Anomalias: Só sobe o limite se cantar 3 vezes acima do limite e achar ótimo
      if (freqMaxReal > f0_max) {
        outlierAgudoCount += 1;
        if (outlierAgudoCount >= 3) {
          f0_max = (f0_max + freqMaxReal) / 2;
          outlierAgudoCount = 0; // reseta
        }
      } else {
        outlierAgudoCount = 0; // se cantou normal, não é anomalia contínua
      }
      
      // Filtro de Anomalias: Só desce o limite se cantar 3 vezes abaixo do limite e achar ótimo
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
    
    // Anexar temporariamente ao profile para salvar depois
    profile.outlier_agudo_count = outlierAgudoCount;
    profile.outlier_grave_count = outlierGraveCount;
  }

  // Salva no banco do usuário
  await setDoc(userRef, {
    profile: {
      ...profile,
      f0_min: parseFloat(f0_min.toFixed(2)),
      f0_max: parseFloat(f0_max.toFixed(2)),
      cantos_validados: cantosValidados,
      feedbacks_negativos_consecutivos: totalErrosContínuos
    }
  }, { merge: true });

  // Salva no localStorage
  try {
    const localProfile = JSON.parse(localStorage.getItem('userVoiceProfile')) || {};
    localProfile.f0_min = parseFloat(f0_min.toFixed(2));
    localProfile.f0_max = parseFloat(f0_max.toFixed(2));
    localProfile.cantos_validados = cantosValidados;
    localProfile.feedbacks_negativos_consecutivos = totalErrosContínuos;
    localStorage.setItem('userVoiceProfile', JSON.stringify(localProfile));
  } catch (e) {}

  // 4. Aprendizado Global (Revisão da Música)
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