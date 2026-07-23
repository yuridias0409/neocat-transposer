
const ESCALA = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "Sib", "Si"];


const FORMAS_AMIGAVEIS_MENORES = ["Mi-", "La-", "Re-"];
const FORMAS_AMIGAVEIS_MAIORES = ["Sol", "Do", "Re", "Mi", "La"];




function normalizarAcorde(nome) {
  return nome.replace('Dó', 'Do').replace('Ré', 'Re').replace('Fá', 'Fa').replace('Lá', 'La');
}






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


  const idxTomReal = ((idxOriginal + semitonesDesejados) % 12 + 12) % 12;
  const tomRealNome = ESCALA[idxTomReal] + (isMenor ? "-" : "");


  let melhorForma = tomRealNome;
  let casaCapo = 0;

  const formasAmigaveis = isMenor ? FORMAS_AMIGAVEIS_MENORES : FORMAS_AMIGAVEIS_MAIORES;

  for (let capo = 0; capo <= 4; capo++) {
    const idxFormaTestada = ((idxTomReal - capo) % 12 + 12) % 12;
    const nomeFormaTestada = ESCALA[idxFormaTestada] + (isMenor ? "-" : "");

    if (formasAmigaveis.includes(nomeFormaTestada)) {
      melhorForma = nomeFormaTestada;
      casaCapo = capo;
      break;
    }
  }





  const nomeFormaBaseNormalizada = normalizarAcorde(melhorForma.replace("-", "").replace("m", ""));
  const idxForma = ESCALA.indexOf(nomeFormaBaseNormalizada);

  let diferencaFormaSemitons = idxForma - idxOriginal;

  if (diferencaFormaSemitons > 6) diferencaFormaSemitons -= 12;
  if (diferencaFormaSemitons < -5) diferencaFormaSemitons += 12;

  return {
    tomReal: tomRealNome,
    formaAcorde: melhorForma,
    capoCasa: casaCapo,
    semitonesTotais: semitonesDesejados,
    diferencaFormaSemitons: diferencaFormaSemitons,
    exibicaoFormatada: casaCapo > 0 ?
    `Forma de ${melhorForma} - Capo ${casaCapo}ª` :
    `Sem Capotraste`
  };
}