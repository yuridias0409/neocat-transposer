import { hzToSemitones } from './musicMath';

export function calcularTomIdeal(vozSalmista, canto) {
  const salmistaMinSemi = hzToSemitones(vozSalmista.minHz);
  const salmistaMaxSemi = hzToSemitones(vozSalmista.maxHz);

  const cantoMinSemi = hzToSemitones(canto.freq_min_curada);
  const cantoMaxSemi = hzToSemitones(canto.freq_max_curada);

  let ajusteSemitons = 0;

  if (cantoMaxSemi > salmistaMaxSemi) {
    ajusteSemitons = Math.floor(salmistaMaxSemi - cantoMaxSemi);
  } else if (cantoMinSemi < salmistaMinSemi) {
    ajusteSemitons = Math.ceil(salmistaMinSemi - cantoMinSemi);
  }

  const novoCantoMinSemi = cantoMinSemi + ajusteSemitons;
  const alertaGraveExtremo = novoCantoMinSemi < salmistaMinSemi;

  return {
    semitones: ajusteSemitons,
    alertaGraveExtremo,
    mensagem: ajusteSemitons === 0 
      ? "Este canto está no tom ideal para sua voz!"
      : `Sugerimos ${ajusteSemitons < 0 ? 'baixar' : 'subir'} ${Math.abs(ajusteSemitons)} semitom(ns).`
  };
}
