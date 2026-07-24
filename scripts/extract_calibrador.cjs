const fs = require('fs');

const content = fs.readFileSync('src/features/calibrador/Calibrador.jsx', 'utf8');
const lines = content.split('\n');

const sliceLines = (start, end) => lines.slice(start - 1, end).join('\n');

const utils = sliceLines(24, 169);
const sustainBar = sliceLines(170, 226);
const useMicPitch = sliceLines(227, 351);
const useAveragePitch = sliceLines(352, 460);
const humStep = sliceLines(461, 629);
const micStep = sliceLines(630, 760);
const successScreen = sliceLines(761, 866);

const calibradorMain = lines.slice(0, 23).join('\n') + '\n' + lines.slice(866).join('\n');

fs.mkdirSync('src/features/calibrador/utils', { recursive: true });
fs.mkdirSync('src/features/calibrador/hooks', { recursive: true });
fs.mkdirSync('src/features/calibrador/components', { recursive: true });

// Utils
fs.writeFileSync('src/features/calibrador/utils/calibradorUtils.js', `
import { getVoiceClassification } from "../../../domain/musicMath";
${utils}
export { freqToNote, freqToNoteName, getVoiceRange, getGender, computeCombined, loadStorage, saveStorage, baseFreqs, MODE_INFO };
`);

// SustainBar
fs.writeFileSync('src/features/calibrador/components/SustainBar.jsx', `
import React from 'react';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
${sustainBar}
export default SustainBar;
`);

// Hooks
fs.writeFileSync('src/features/calibrador/hooks/useMicPitch.js', `
import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';
import { freqToNoteName } from '../utils/calibradorUtils';
${useMicPitch}
export default useMicPitch;
`);

fs.writeFileSync('src/features/calibrador/hooks/useAveragePitch.js', `
import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';
import { freqToNoteName } from '../utils/calibradorUtils';
${useAveragePitch}
export default useAveragePitch;
`);

// Components
fs.writeFileSync('src/features/calibrador/components/HumStep.jsx', `
import React, { useState, useEffect } from 'react';
import { Mic, ArrowRight, Music2, Square, Play } from 'lucide-react';
import SustainBar from './SustainBar';
import useAveragePitch from '../hooks/useAveragePitch';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
${humStep}
export default HumStep;
`);

fs.writeFileSync('src/features/calibrador/components/MicStep.jsx', `
import React, { useState, useEffect } from 'react';
import { Mic, ArrowRight, Music2, Square, Play } from 'lucide-react';
import SustainBar from './SustainBar';
import useMicPitch from '../hooks/useMicPitch';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
${micStep}
export default MicStep;
`);

fs.writeFileSync('src/features/calibrador/components/SuccessScreen.jsx', `
import React from 'react';
import { CheckCircle, ArrowRight, User } from 'lucide-react';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
${successScreen}
export default SuccessScreen;
`);

// Main Calibrador
const newImports = `
import { loadStorage, saveStorage, computeCombined, getGender, baseFreqs, MODE_INFO } from './utils/calibradorUtils';
import SustainBar from './components/SustainBar';
import HumStep from './components/HumStep';
import MicStep from './components/MicStep';
import SuccessScreen from './components/SuccessScreen';
`;

let finalCalibrador = calibradorMain.replace('import "./Calibrador.css";\nimport { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";', 'import "./Calibrador.css";\nimport { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";\n' + newImports);

// Need to export constants that were moved to utils if they are used in Calibrador? Yes, we imported them.
// Ensure local consts are removed from the main file.
fs.writeFileSync('src/features/calibrador/Calibrador.jsx', finalCalibrador, 'utf8');

console.log("Extraction completed.");
