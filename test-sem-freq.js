import { calcularTomIdealInteligente } from './src/utils/transpositionEngine.js';
import { cantosData } from './src/data.js';

const vozSalmista = {
  minHz: 103.83,
  maxHz: 311.13,
  tipoVoz: 'Barítono'
};

const canto = { ...cantosData['a-cabana-dos-pastores'] };
delete canto.freq_min_curada;
delete canto.freq_max_curada;

const res = calcularTomIdealInteligente(vozSalmista, canto, {}, {});
console.log('Test sem freq:', res);
