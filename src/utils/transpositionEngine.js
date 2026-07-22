import { hzToSemitones } from './musicMath';

export function calcularTomIdealInteligente(vozSalmista, canto, perfilUsuario = {}, cantoFirebaseData = {}) {
  // 1. Cálculo Teórico Puro (Física do Áudio vs Frequência do Salmista)
  const salmistaMaxSemi = hzToSemitones(vozSalmista.maxHz);
  const cantoMaxSemi = hzToSemitones(canto.freq_max_curada);
  const cantoMinSemi = hzToSemitones(canto.freq_min_curada);
  const salmistaMinSemi = hzToSemitones(vozSalmista.minHz);

  let semitonesCalculado = 0;

  if (cantoMaxSemi > salmistaMaxSemi) {
    semitonesCalculado = Math.floor(salmistaMaxSemi - cantoMaxSemi);
  } else if (cantoMinSemi < salmistaMinSemi) {
    semitonesCalculado = Math.ceil(salmistaMinSemi - cantoMinSemi);
  }

  // 2. Aplicação das Camadas de Aprendizado
  const offsetPessoal = perfilUsuario?.preferencias_tom?.offset_pessoal_semitones || 0;
  
  // Extração do ajuste global do canto (via Firestore)
  const metricasCanto = cantoFirebaseData?.metricas_feedback || {};
  let offsetGlobalCanto = metricasCanto.ajuste_global_semitones || 0;
  
  // Heurística de auto-ajuste: se a proporção de alto for muito maior e não houver ajuste global setado manualmente
  if (!offsetGlobalCanto && metricasCanto.total_avaliacoes > 5) {
    const propAlto = metricasCanto.qtd_alto_demais / metricasCanto.total_avaliacoes;
    const propBaixo = metricasCanto.qtd_baixo_demais / metricasCanto.total_avaliacoes;
    if (propAlto > 0.6) offsetGlobalCanto = -1;
    if (propBaixo > 0.6) offsetGlobalCanto = 1;
  }

  // Tom Final Adaptado pelas experiências anteriores
  const semitonesFinal = semitonesCalculado + offsetPessoal + offsetGlobalCanto;

  const novoCantoMinSemi = cantoMinSemi + semitonesFinal;
  const alertaGraveExtremo = novoCantoMinSemi < salmistaMinSemi;

  let mensagemBase = semitonesFinal === 0 
    ? "Este canto parece estar no tom ideal para sua voz!"
    : `Sugerimos ${semitonesFinal < 0 ? 'baixar' : 'subir'} ${Math.abs(semitonesFinal)} semitom(ns).`;

  // Tom de esforço: um pouco mais alto que o ideal calculado, mas que ainda não passa do limite absoluto
  // O limite absoluto do salmista é salmistaMaxSemi. O canto tem cantoMaxSemi + semitonesFinal.
  // A diferença entre salmistaMaxSemi e (cantoMaxSemi + semitonesFinal) é a "folga" que temos.
  const folgaAguda = Math.floor(salmistaMaxSemi - (cantoMaxSemi + semitonesFinal));
  // O tom de esforço tenta subir 1 ou 2 semitons a mais, contanto que caiba na folga
  let semitonesEsforco = null;
  if (folgaAguda >= 1) {
    semitonesEsforco = semitonesFinal + (folgaAguda > 1 ? 2 : 1);
  } else if (semitonesFinal > semitonesCalculado) {
    // Se o tom já foi puxado pra cima pelas heurísticas pessoais e estourou, o esforço pode ser simplesmente recuar 1
    semitonesEsforco = semitonesFinal - 1;
  }

  return {
    semitones: semitonesFinal,
    semitonesEsforco: semitonesEsforco,
    alertaGraveExtremo,
    origemCalculo: {
      teorico: semitonesCalculado,
      ajustePessoal: offsetPessoal,
      ajusteGlobal: offsetGlobalCanto
    },
    mensagem: mensagemBase
  };
}
