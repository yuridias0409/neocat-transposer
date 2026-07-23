/**
 * Analisador de Classificação Vocal por Processamento Digital de Sinais (DSP)
 */
export default class VoiceClassifier {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.speedOfSound = 35000; // Velocidade do som no trato vocal em cm/s (350 m/s)
    }

    /**
     * 1. Detecção de Pitch (Frequência Fundamental - f0) usando Autocorrelação
     * @param {Float32Array} buffer - Amostra de áudio no domínio do tempo
     * @returns {number} Frequência em Hz
     */
    getPitch(buffer) {
        const SIZE = buffer.length;
        let sumSq = 0;

        for (let i = 0; i < SIZE; i++) {
            sumSq += buffer[i] * buffer[i];
        }
        
        const rms = Math.sqrt(sumSq / SIZE);
        if (rms < 0.01) return 0; // Sinal muito fraco ou silêncio

        const maxLags = Math.floor(SIZE / 2);
        const correlations = new Float32Array(maxLags);

        // Autocorrelação Rxx(tau)
        for (let lag = 0; lag < maxLags; lag++) {
            let sum = 0;
            for (let i = 0; i < maxLags; i++) {
                sum += buffer[i] * buffer[i + lag];
            }
            correlations[lag] = sum;
        }

        // Encontrar o primeiro vale para evitar falsos positivos
        let lag = 0;
        while (lag < maxLags - 1 && correlations[lag] > correlations[lag + 1]) {
            lag++;
        }

        // Encontrar o pico máximo após o primeiro vale
        let maxVal = -1;
        let bestLag = -1;

        for (let i = lag; i < maxLags; i++) {
            if (correlations[i] > maxVal) {
                maxVal = correlations[i];
                bestLag = i;
            }
        }

        return bestLag > 0 ? this.sampleRate / bestLag : 0;
    }

    /**
     * 2. Transformada Rápida de Fourier (FFT) simples (Cooley-Tukey)
     * @param {Float32Array} buffer - Sinal de áudio
     * @returns {Float32Array} Espectro de Magnitude
     */
    computeFFT(buffer) {
        // Find next power of 2
        let p = 1;
        while (p < buffer.length) p *= 2;
        const N = p;
        
        const re = new Float32Array(N);
        const im = new Float32Array(N);

        for (let i = 0; i < buffer.length; i++) re[i] = buffer[i];

        // Reordenação por Inversão de Bits
        for (let i = 0; i < N; i++) {
            let j = 0;
            for (let k = 0, n = N; n > 1; n >>= 1, k++) {
                j = (j << 1) | ((i >> k) & 1);
            }
            if (j > i) {
                let tempRe = re[i]; re[i] = re[j]; re[j] = tempRe;
            }
        }

        // Borboleta Cooley-Tukey
        for (let len = 2; len <= N; len <<= 1) {
            let halfLen = len >> 1;
            let angle = -2 * Math.PI / len;
            let wstepRe = Math.cos(angle);
            let wstepIm = Math.sin(angle);

            for (let i = 0; i < N; i += len) {
                let wRe = 1, wIm = 0;
                for (let j = 0; j < halfLen; j++) {
                    let uRe = re[i + j], uIm = im[i + j];
                    let vRe = re[i + j + halfLen] * wRe - im[i + j + halfLen] * wIm;
                    let vIm = re[i + j + halfLen] * wIm + im[i + j + halfLen] * wRe;

                    re[i + j] = uRe + vRe;
                    im[i + j] = uIm + vIm;
                    re[i + j + halfLen] = uRe - vRe;
                    im[i + j + halfLen] = uIm - vIm;

                    let nextWRe = wRe * wstepRe - wIm * wstepIm;
                    let nextWIm = wRe * wstepIm + wIm * wstepRe;
                    wRe = nextWRe; wIm = nextWIm;
                }
            }
        }

        // Espectro de Magnitude
        const magnitude = new Float32Array(N / 2);
        for (let i = 0; i < N / 2; i++) {
            magnitude[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
        }
        return magnitude;
    }

    /**
     * 3. Cálculo do Spectral Tilt (Inclinação Espectral H1 - H2 em dB)
     * @param {Float32Array} magnitude - Espectro de frequência
     * @param {number} f0 - Frequência fundamental
     * @returns {number} Diferença em dB (H1 - H2)
     */
    getSpectralTilt(magnitude, f0) {
        if (f0 <= 0) return 0;

        const binSize = this.sampleRate / (magnitude.length * 2);
        const h1Bin = Math.round(f0 / binSize);
        const h2Bin = Math.round((2 * f0) / binSize);

        if (h2Bin >= magnitude.length) return 0;

        const amplitudeH1 = magnitude[h1Bin] || 1e-6;
        const amplitudeH2 = magnitude[h2Bin] || 1e-6;

        // Converter para Decibéis: dB = 20 * log10(A)
        const dbH1 = 20 * Math.log10(amplitudeH1);
        const dbH2 = 20 * Math.log10(amplitudeH2);

        return dbH1 - dbH2;
    }

    /**
     * 4. Estimativa do Comprimento do Trato Vocal (L_trato em cm)
     * @param {Float32Array} magnitude - Espectro de frequência
     * @returns {number} Comprimento estimado em cm
     */
    getVocalTractLength(magnitude) {
        const binSize = this.sampleRate / (magnitude.length * 2);
        const peaks = [];

        // Detecção simplificada de picos de formantes no espectro
        for (let i = 2; i < magnitude.length - 2; i++) {
            if (
                magnitude[i] > magnitude[i - 1] &&
                magnitude[i] > magnitude[i - 2] &&
                magnitude[i] > magnitude[i + 1] &&
                magnitude[i] > magnitude[i + 2]
            ) {
                peaks.push(i * binSize);
            }
        }

        if (peaks.length < 2) return 15.0; // Valor médio padrão caso o sinal seja ruidoso

        // Calcular a distância média entre os picos ressonantes (Delta F)
        let totalSpacing = 0;
        let count = 0;

        for (let i = 1; i < Math.min(peaks.length, 5); i++) {
            totalSpacing += (peaks[i] - peaks[i - 1]);
            count++;
        }

        const deltaF = totalSpacing / count;

        // Fórmulas Acústicas: L_trato = c / (2 * Delta_F)
        const lTrato = this.speedOfSound / (2 * deltaF);

        // Limite fisiológico humano razoável (10cm a 22cm)
        return Math.max(10, Math.min(22, lTrato));
    }

    /**
     * 5. Algoritmo de Classificação do Vetor
     * @param {Float32Array} lowBuffer - Áudio do cantarolar grave
     * @param {Float32Array} highBuffer - Áudio do cantarolar agudo
     * @returns {Object} Diagnóstico detalhado do perfil vocal
     */
    analyze(lowBuffer, highBuffer) {
        const f0Min = this.getPitch(lowBuffer);
        const f0Max = this.getPitch(highBuffer);

        const magLow = this.computeFFT(lowBuffer);
        const spectralTilt = this.getSpectralTilt(magLow, f0Min);
        const vocalTractLength = this.getVocalTractLength(magLow);

        // Mapeamento baseado em limites acústico-fisiológicos
        let classification = "Indefinido";

        if (f0Min < 115) {
            classification = (vocalTractLength > 17.0) ? "Baixo" : "Barítono";
        } else if (f0Min >= 115 && f0Min < 165) {
            classification = (vocalTractLength > 16.5 || spectralTilt > 6) ? "Barítono" : "Tenor";
        } else if (f0Min >= 165 && f0Min < 210) {
            classification = (vocalTractLength > 15.0) ? "Contralto" : "Mezzo-Soprano";
        } else {
            classification = (vocalTractLength < 14.0) ? "Soprano" : "Mezzo-Soprano";
        }

        return {
            classificacao: classification,
            metricas: {
                f0Min,
                f0Max,
                comprimentoTratoVocal: vocalTractLength,
                spectralTiltH1H2: spectralTilt
            }
        };
    }
}
