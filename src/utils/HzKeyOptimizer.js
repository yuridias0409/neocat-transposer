class HzKeyOptimizer {
    constructor() {
        // Faixas de conforto da plateia expressas puramente em Hz
        this.AUDIENCE_PRESETS_HZ = {
            MALE: { min: 110.00, max: 261.63 },    // ~A2 a C4 em Hz
            FEMALE: { min: 220.00, max: 523.25 },  // ~A3 a C5 em Hz
            MIXED: { min: 164.81, max: 349.23 }    // ~E3 a F4 em Hz (compromisso)
        };
    }

    /**
     * Penalidade baseada no desvio logarítmico da frequência em relação aos limites em Hz
     */
    penaltyHz(frequency, minHz, maxHz) {
        if (frequency < minHz) {
            // Distância logarítmica para frequências abaixo do limite
            return Math.pow(Math.log2(minHz / frequency), 2);
        } else if (frequency > maxHz) {
            // Distância logarítmica para frequências acima do limite
            return Math.pow(Math.log2(frequency / maxHz), 2);
        }
        return 0; // Dentro da zona confortável (Sem penalidade)
    }

    /**
     * Encontra o fator multiplicador de frequência ideal
     * @param {Array<number>} songFrequenciesHz - Array com as frequências da melodia em Hz
     * @param {Object} singerRangeHz - { min: 98.00, max: 329.63 } (Extensão em Hz)
     * @param {Object|string} audiencePreset - 'MALE', 'FEMALE', 'MIXED' ou { min: 110.0, max: 261.63 }
     * @param {number} lambda - Peso dado ao conforto da plateia (padrão: 1.5)
     * @param {number} maxShiftSemitones - Busca num raio de semitonos (padrão: 12)
     */
    findOptimalKeyHz(songFrequenciesHz, singerRangeHz, audiencePreset = 'MIXED', lambda = 1.5, maxShiftSemitones = 12) {
        const audRange = typeof audiencePreset === 'string' 
            ? this.AUDIENCE_PRESETS_HZ[audiencePreset] 
            : audiencePreset;

        let bestShift = 0;
        let bestRatio = 1.0;
        let minCost = Infinity;

        // Testar multiplicadores r = 2^(k/12)
        for (let k = -maxShiftSemitones; k <= maxShiftSemitones; k++) {
            const ratio = Math.pow(2, k / 12);
            let singerPenaltyTotal = 0;
            let audiencePenaltyTotal = 0;

            for (const f of songFrequenciesHz) {
                const transposedF = f * ratio;
                singerPenaltyTotal += this.penaltyHz(transposedF, singerRangeHz.min, singerRangeHz.max);
                audiencePenaltyTotal += this.penaltyHz(transposedF, audRange.min, audRange.max);
            }

            const totalCost = singerPenaltyTotal + (lambda * audiencePenaltyTotal);

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
            alertaAmplitudeExcessiva: ratioOrig > 2.0, // Razão > 2 significa que a música cobre mais de 1 oitava
            melodiaOriginalHz: {
                minHz: minHzOrig,
                maxHz: maxHzOrig,
                razaoHz: Number(ratioOrig.toFixed(2))
            },
            melodiaTranspostaHz: {
                minHz: Number((minHzOrig * bestRatio).toFixed(2)),
                maxHz: Number((maxHzOrig * bestRatio).toFixed(2))
            },
            frequenciasTranspostasHz: songFrequenciesHz.map(f => Number((f * bestRatio).toFixed(2)))
        };
    }
}

export default new HzKeyOptimizer();
