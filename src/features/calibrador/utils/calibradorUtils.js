import { getVoiceClassification } from "../../../domain/musicMath";
import { Music2, UserPlus, Mic } from "lucide-react";
const freqToNote = (freq) => {
  if (!freq || freq < 20) return null;
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  const h = Math.round(12 * Math.log2(freq / c0));
  const octave = Math.floor(h / 12);
  const n = ((h % 12) + 12) % 12;
  return {
    note: notes[n],
    octave,
    name: `${notes[n]}${octave}`,
    freq,
  };
};
const freqToNoteName = (freq) => {
  const n = freqToNote(freq);
  return n ? n.name : "?";
};
const getVoiceRange = (minFreq, maxFreq) => {
  if (!minFreq || !maxFreq) return null;
  const octaves = (12 * Math.log2(maxFreq / minFreq)) / 12;
  const oct = Math.floor(octaves);
  const semis = Math.round((octaves - oct) * 12);
  const octStr =
    oct > 0
      ? ` +${oct} oit${semis > 0 ? ` ${semis}st` : ""}`
      : semis > 0
        ? ` +${semis}st`
        : "";
  return `${freqToNoteName(minFreq)} → ${freqToNoteName(maxFreq)}${octStr}`;
};
const getGender = (tipoVoz) => {
  if (["Baixo", "Barítono", "Tenor"].includes(tipoVoz)) return "masculino";
  if (["Contralto", "Mezzo-Soprano", "Soprano"].includes(tipoVoz))
    return "feminino";
  return "masculino";
};
const computeCombined = (calibrations) => {
  const vals = Object.values(calibrations).filter((c) => c && c.min && c.max);
  if (vals.length === 0) return null;
  const avgMin = vals.reduce((s, c) => s + c.min.freq, 0) / vals.length;
  const avgMax = vals.reduce((s, c) => s + c.max.freq, 0) / vals.length;
  const tipo = getVoiceClassification(avgMin, avgMax);
  const gender = getGender(tipo);
  return {
    minHz: avgMin,
    maxHz: avgMax,
    f0_min: avgMin,
    f0_max: avgMax,
    tipoVoz: tipo,
    gender: gender,
    min: {
      name: freqToNoteName(avgMin),
      freq: avgMin,
    },
    max: {
      name: freqToNoteName(avgMax),
      freq: avgMax,
    },
  };
};
const loadStorage = () => {
  try {
    const raw = localStorage.getItem("calibrationData");
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    const old = localStorage.getItem("userVoiceProfile");
    if (old) {
      const p = JSON.parse(old);
      return {
        calibrations: {},
        combined: p,
      };
    }
  } catch {}
  return {
    calibrations: {},
    combined: null,
  };
};
const saveStorage = (data) => {
  localStorage.setItem("calibrationData", JSON.stringify(data));
  if (data.combined) {
    let existingProfile = {};
    try {
      const rawProfile = localStorage.getItem("userVoiceProfile");
      if (rawProfile) existingProfile = JSON.parse(rawProfile);
    } catch {}
    localStorage.setItem(
      "userVoiceProfile",
      JSON.stringify({
        ...existingProfile,
        ...data.combined,
        learningCautela: 0,
      }),
    );
  } else {
    localStorage.removeItem("userVoiceProfile");
  }
};
const baseFreqs = {
  E2: 82.41,
  A2: 110.0,
  D3: 146.83,
  G3: 196.0,
  C4: 261.63,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
};
const MODE_INFO = {
  hum: {
    label: "Cantarolar",
    suffix: "(recomendado)",
    desc: "Cantarole e eu gravo",
    icon: Music2,
    color: "#b91c1c",
  },
  assistant: {
    label: "Salmista Assistente",
    desc: "Guiado por áudio",
    icon: UserPlus,
    color: "#b91c1c",
  },
  mic: {
    label: "Automático (Microfone)",
    desc: "Cante e eu descubro",
    icon: Mic,
    color: "#b91c1c",
  },
};
export {
  freqToNote,
  freqToNoteName,
  getVoiceRange,
  getGender,
  computeCombined,
  loadStorage,
  saveStorage,
  baseFreqs,
  MODE_INFO,
};
