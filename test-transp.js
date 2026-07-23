import fs from 'fs';
import { calcularTomIdealInteligente } from './src/utils/transpositionEngine.js';
import { cantosData } from './src/data.js';

// We need to mock firebase data if we don't have connection
// But we can just pass some mock metricas_feedback to see if it changes the result.
const vozSalmista = {
  minHz: 110,
  maxHz: 330,
  tipoVoz: 'Desconhecido'
};

const canto = cantosData['a-cabana-dos-pastores'];

// Test 1: empty firebase data
const res1 = calcularTomIdealInteligente(vozSalmista, canto, {}, {});
console.log('Sem dados firebase:', res1);

// Test 2: with metricas_feedback
const res2 = calcularTomIdealInteligente(vozSalmista, canto, {}, {
  metricas_feedback: {
    ajuste_global_semitones: -1,
    total_avaliacoes: 10
  }
});
console.log('Com metricas_feedback (-1):', res2);

// Test 3: with ia_metrics
const res3 = calcularTomIdealInteligente(vozSalmista, canto, {}, {
  ia_metrics: {
    'Desconhecido': {
      '-1': 5,
      '4': 1
    }
  }
});
console.log('Com ia_metrics:', res3);
