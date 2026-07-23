import os
import glob
import json
import librosa
import numpy as np

AUDIO_DIR = "./public/audios"
OUTPUT_DIR = "./public/pitch_data"

def extract_pitch_curve(audio_path, output_path):
    print(f"Processando: {os.path.basename(audio_path)}")
    try:
        y, sr = librosa.load(audio_path, sr=22050) # Use 22050Hz to speed up
        
        hop_length = sr // 10
        fmin = librosa.note_to_hz('C2')
        fmax = librosa.note_to_hz('C6')
        
        f0 = librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr, hop_length=hop_length)
        
        # We also need some measure of energy to filter out silence
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop_length)[0]
        rms_threshold = np.max(rms) * 0.05 # 5% of max energy
        
        times = librosa.times_like(f0, sr=sr, hop_length=hop_length)
        
        curve = []
        for t, freq, energy in zip(times, f0, rms):
            if energy > rms_threshold and not np.isnan(freq) and freq > 0:
                curve.append({"t": round(float(t), 2), "f": round(float(freq), 2)})
                
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(curve, f)
            
        print(f"Salvo em {output_path} ({len(curve)} pontos)")
    except Exception as e:
        print(f"Erro ao processar {audio_path}: {e}")

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    audio_files = glob.glob(os.path.join(AUDIO_DIR, "*.mp3"))
    
    print(f"Encontrados {len(audio_files)} áudios.")
    # Limiting to first 5 just for test in the current session so it doesn't take forever, 
    # The user can process all later.
    for audio_path in audio_files:
        filename = os.path.basename(audio_path)
        output_name = filename.replace(".mp3", ".json")
        output_path = os.path.join(OUTPUT_DIR, output_name)
        
        if not os.path.exists(output_path):
            extract_pitch_curve(audio_path, output_path)
        else:
            print(f"Pulando {filename}, JSON já existe.")
    
    print("\nConcluído processamento de todos os áudios.")
