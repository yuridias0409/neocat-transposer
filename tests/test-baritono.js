import { calcularTomIdealInteligente } from './src/utils/transpositionEngine.js';
import { cantosData } from './src/data.js';

const vozSalmista = {
  minHz: 103.83,
  maxHz: 311.13,
  tipoVoz: 'Barítono'
};

const canto = cantosData['a-cabana-dos-pastores'];

const res = calcularTomIdealInteligente(vozSalmista, canto, {}, {});
console.log('Test with Barítono:', res);
