class HzKeyOptimizer {
  constructor() {
    this.AUDIENCE_PRESETS_HZ = {
      MALE: {
        min: 110.0,
        max: 261.63,
      },
      FEMALE: {
        min: 220.0,
        max: 523.25,
      },
      MIXED: {
        min: 164.81,
        max: 349.23,
      },
    };
  }
  penaltyHz(frequency, minHz, maxHz) {
    if (frequency < minHz) {
      return Math.pow(Math.log2(minHz / frequency), 2);
    } else if (frequency > maxHz) {
      return Math.pow(Math.log2(frequency / maxHz), 2);
    }
    return 0;
  }
  findOptimalKeyHz(
    songFrequenciesHz,
    singerRangeHz,
    audiencePreset = "MIXED",
    lambda = 1.5,
    maxShiftSemitones = 12,
  ) {
    const audRange =
      typeof audiencePreset === "string"
        ? this.AUDIENCE_PRESETS_HZ[audiencePreset]
        : audiencePreset;
    let bestShift = 0;
    let bestRatio = 1.0;
    let minCost = Infinity;
    for (let k = -maxShiftSemitones; k <= maxShiftSemitones; k++) {
      const ratio = Math.pow(2, k / 12);
      let singerPenaltyTotal = 0;
      let audiencePenaltyTotal = 0;
      for (const f of songFrequenciesHz) {
        const transposedF = f * ratio;
        singerPenaltyTotal += this.penaltyHz(
          transposedF,
          singerRangeHz.min,
          singerRangeHz.max,
        );
        audiencePenaltyTotal += this.penaltyHz(
          transposedF,
          audRange.min,
          audRange.max,
        );
      }
      const totalCost = singerPenaltyTotal + lambda * audiencePenaltyTotal;
      if (totalCost < minCost) {
        minCost = totalCost;
        bestShift = k;
        bestRatio = ratio;
      }
    }
    const minHzOrig = Math.min(...songFrequenciesHz);
    const maxHzOrig = Math.max(...songFrequenciesHz);
    const ratioOrig = maxHzOrig / minHzOrig;
    return {
      fatorMultiplicadorHz: Number(bestRatio.toFixed(4)),
      deslocamentoEquivalenteSemitonos: bestShift,
      custoMinimo: Number(minCost.toFixed(4)),
      alertaAmplitudeExcessiva: ratioOrig > 2.0,
      melodiaOriginalHz: {
        minHz: minHzOrig,
        maxHz: maxHzOrig,
        razaoHz: Number(ratioOrig.toFixed(2)),
      },
      melodiaTranspostaHz: {
        minHz: Number((minHzOrig * bestRatio).toFixed(2)),
        maxHz: Number((maxHzOrig * bestRatio).toFixed(2)),
      },
      frequenciasTranspostasHz: songFrequenciesHz.map((f) =>
        Number((f * bestRatio).toFixed(2)),
      ),
    };
  }
}
export default new HzKeyOptimizer();
