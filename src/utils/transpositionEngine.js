import { hzToSemitones } from './musicMath';

export function calcularTomIdealInteligente(vozSalmista, canto, perfilUsuario = {}, cantoFirebaseData = {}) {

  const salmistaMaxSemi = hzToSemitones(vozSalmista.maxHz);
  const salmistaMinSemi = hzToSemitones(vozSalmista.minHz);
  const cantoMaxSemi = hzToSemitones(canto.freq_max_curada);
  const cantoMinSemi = hzToSemitones(canto.freq_min_curada);


  const songWideness = cantoMaxSemi - cantoMinSemi;
  const singerWideness = salmistaMaxSemi - salmistaMinSemi;

  // 1. Agrupamento por Classificação Vocal (Clustering Intelligence)
  const iaDataVoice = cantoFirebaseData?.ia_metrics?.[vozSalmista.tipoVoz];
  if (iaDataVoice) {
    let maxVotes = 0;
    let totalVotes = 0;
    let bestTransposition = null;
    for (const [transpStr, votes] of Object.entries(iaDataVoice)) {
      totalVotes += votes;
      if (votes > maxVotes) {
        maxVotes = votes;
        bestTransposition = parseInt(transpStr, 10);
      }
    }
    
    // Se >= 50% dos salmistas deste tipo de voz concordam num tom (min 2 votos)
    if (maxVotes >= 2 && (maxVotes / totalVotes) >= 0.5 && bestTransposition !== null) {
      return {
        semitones: bestTransposition,
        semitonesEsforco: bestTransposition,
        mensagem: `Tom inteligente baseado em salmistas com a mesma voz que você (${vozSalmista.tipoVoz}).`
      };
    }
  }



  const offsetFromSingerLowest = songWideness >= singerWideness ?
  0 :
  Math.round((singerWideness - songWideness) / 2);



  const distanceLowest = cantoMinSemi - salmistaMinSemi;


  const centeredOffset = -Math.round(distanceLowest) + offsetFromSingerLowest;


  const offsetPessoal = perfilUsuario?.preferencias_tom?.offset_pessoal_semitones || 0;


  const metricasCanto = cantoFirebaseData?.metricas_feedback || {};
  let offsetGlobalCanto = metricasCanto.ajuste_global_semitones || 0;


  if (!offsetGlobalCanto && metricasCanto.total_avaliacoes > 5) {
    const propAlto = (metricasCanto.qtd_alto_demais || 0) / metricasCanto.total_avaliacoes;
    const propBaixo = (metricasCanto.qtd_baixo_demais || 0) / metricasCanto.total_avaliacoes;

    if (propAlto > 0.6) offsetGlobalCanto = -1;
    if (propBaixo > 0.6) offsetGlobalCanto = 1;
  }



  const semitonesFinal = centeredOffset + offsetPessoal + offsetGlobalCanto;

  const novoCantoMinSemi = cantoMinSemi + semitonesFinal;
  const alertaGraveExtremo = novoCantoMinSemi < salmistaMinSemi;




  const folgaAguda = Math.floor(salmistaMaxSemi - (cantoMaxSemi + semitonesFinal));
  let semitonesEsforco = null;

  if (folgaAguda >= 1) {

    semitonesEsforco = semitonesFinal + (folgaAguda >= 2 ? 2 : 1);
  } else if (semitonesFinal > centeredOffset) {

    semitonesEsforco = centeredOffset;
  } else {

    semitonesEsforco = semitonesFinal - 1;
  }

  let mensagem = "Calculado pelo motor centralizado.";
  if (offsetPessoal) mensagem += " Ajuste pessoal de " + offsetPessoal + ".";
  if (offsetGlobalCanto) mensagem += " Ajuste comunitário de " + offsetGlobalCanto + ".";

  return {
    semitones: semitonesFinal,
    semitonesEsforco: semitonesEsforco,
    alertaGraveExtremo,
    origemCalculo: {
      teorico: centeredOffset,
      ajustePessoal: offsetPessoal,
      ajusteGlobal: offsetGlobalCanto
    },
    mensagem: mensagem
  };
}