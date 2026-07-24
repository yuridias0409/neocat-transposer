import { calcularTomIdealInteligente } from './src/utils/transpositionEngine.js';
import { cantosData } from './src/data.js';
import { otimizarCapoETom } from './src/utils/capoEngine.js';

const vozSalmista = {
  minHz: 103.83,
  maxHz: 311.13,
  tipoVoz: 'Barítono'
};

const canto = cantosData['a-ceifa-das-nacoes'];

const res = calcularTomIdealInteligente(vozSalmista, canto, {}, {});
console.log('Test ceifa:', res);
console.log('Capo:', otimizarCapoETom(canto.tom_original, res.semitones));
