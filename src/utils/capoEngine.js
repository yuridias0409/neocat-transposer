// Escala cromática simplificada em português
const ESCALA = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

// Formas de acordes considerados fáceis/padrão para salmistas
const FORMAS_AMIGAVEIS_MENORES = ["Mi-", "La-", "Re-"];
const FORMAS_AMIGAVEIS_MAIORES = ["Sol", "Do", "Re", "Mi", "La"];

/**
 * Normaliza o nome do acorde para casar com a escala
 */
function normalizarAcorde(nome) {
  return nome.replace('Dó', 'Do').replace('Ré', 'Re').replace('Fá', 'Fa').replace('Lá', 'La');
}

/**
 * Calcula a combinação ideal de Tom Real, Forma do Acorde e Casa do Capo (0 a 4)
 * @param {string} tomOriginal - Ex: "Si-" ou "Mi-"
 * @param {number} semitonesDesejados - Ex: +9 ou -2
 */
export function otimizarCapoETom(tomOriginal, semitonesDesejados) {
  if (!tomOriginal || tomOriginal === '?') {
    return {
      tomReal: '?',
      formaAcorde: '?',
      capoCasa: 0,
      semitonesTotais: semitonesDesejados,
      diferencaFormaSemitons: semitonesDesejados,
      exibicaoFormatada: ''
    };
  }

  const isMenor = tomOriginal.includes("-") || tomOriginal.includes("m");
  const nomeBaseNormalizado = normalizarAcorde(tomOriginal.replace("-", "").replace("m", ""));
  
  let idxOriginal = ESCALA.indexOf(nomeBaseNormalizado);
  if (idxOriginal === -1) idxOriginal = 0;

  // Garantir índice positivo no módulo 12
  const idxTomReal = ((idxOriginal + semitonesDesejados) % 12 + 12) % 12;
  const tomRealNome = ESCALA[idxTomReal] + (isMenor ? "-" : "");

  // 2. Encontrar a melhor forma de acorde com Capo entre 0 e 4
  let melhorForma = tomRealNome;
  let casaCapo = 0;

  const formasAmigaveis = isMenor ? FORMAS_AMIGAVEIS_MENORES : FORMAS_AMIGAVEIS_MAIORES;

  for (let capo = 0; capo <= 4; capo++) {
    const idxFormaTestada = ((idxTomReal - capo) % 12 + 12) % 12;
    const nomeFormaTestada = ESCALA[idxFormaTestada] + (isMenor ? "-" : "");

    if (formasAmigaveis.includes(nomeFormaTestada)) {
      melhorForma = nomeFormaTestada;
      casaCapo = capo;
      break; // Encontrou a primeira forma amigável com menor/ideal capo
    }
  }

  // Se não achar forma amigável de 0 a 4, deixa a forma igual ao tom real (sem capo)
  
  // Calcular a diferença de semitons da Forma sugerida em relação ao Tom Original
  // Isso é necessário para transpor o "Guia de Acordes" para a Forma Sugerida
  const nomeFormaBaseNormalizada = normalizarAcorde(melhorForma.replace("-", "").replace("m", ""));
  const idxForma = ESCALA.indexOf(nomeFormaBaseNormalizada);
  
  let diferencaFormaSemitons = idxForma - idxOriginal;
  // Ajuste para o caminho mais curto (Ex: -1 em vez de +11)
  if (diferencaFormaSemitons > 6) diferencaFormaSemitons -= 12;
  if (diferencaFormaSemitons < -5) diferencaFormaSemitons += 12;

  return {
    tomReal: tomRealNome,
    formaAcorde: melhorForma,
    capoCasa: casaCapo, // Valor de 0 a 4
    semitonesTotais: semitonesDesejados,
    diferencaFormaSemitons: diferencaFormaSemitons,
    exibicaoFormatada: casaCapo > 0 
      ? `Forma de ${melhorForma} - Capo ${casaCapo}ª`
      : `Sem Capotraste`
  };
}
