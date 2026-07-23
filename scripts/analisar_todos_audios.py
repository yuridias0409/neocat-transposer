import os
import json
import librosa
import numpy as np

# PITCH CLASS NAMES corresponding to American format, will convert to Latin in data
PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

AMERICAN_TO_LATIN = {
    'C': 'Do', 'C#': 'Do#', 'Db': 'Do#',
    'D': 'Re', 'D#': 'Re#', 'Eb': 'Re#',
    'E': 'Mi',
    'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Fa#',
    'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Sol#',
    'A': 'La', 'A#': 'La#', 'Bb': 'La#',
    'B': 'Si'
}

def translate_to_latin(note_str):
    if not note_str:
        return ""
    # Check if minor
    is_minor = False
    base_note = note_str
    if note_str.endswith('m'):
        is_minor = True
        base_note = note_str[:-1]
    
    latin_base = AMERICAN_TO_LATIN.get(base_note, base_note)
    suffix = "-" if is_minor else ""
    return f"{latin_base}{suffix}"

def get_key_from_chromagram(chromagram):
    chroma_sum = np.sum(chromagram, axis=1)
    
    maj_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
    min_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
    
    maj_profile = np.array(maj_profile)
    min_profile = np.array(min_profile)
    
    maj_corrs = []
    min_corrs = []
    for i in range(12):
        shifted_chroma = np.roll(chroma_sum, -i)
        maj_corrs.append(np.corrcoef(maj_profile, shifted_chroma)[0,1])
        min_corrs.append(np.corrcoef(min_profile, shifted_chroma)[0,1])
        
    best_maj_idx = np.argmax(maj_corrs)
    best_min_idx = np.argmax(min_corrs)
    
    if maj_corrs[best_maj_idx] > min_corrs[best_min_idx]:
        return PITCH_CLASS_NAMES[best_maj_idx]
    else:
        return PITCH_CLASS_NAMES[best_min_idx] + "m"

def analyze_audio_file(local_path):
    try:
        y, sr = librosa.load(local_path, duration=60.0)
        # Extract BPM
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo[0]) if isinstance(tempo, np.ndarray) else float(tempo)
        
        # Extract Key
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key = get_key_from_chromagram(chroma)
        
        return translate_to_latin(key), round(bpm)
    except Exception as e:
        print(f"Erro analisando {local_path}: {e}")
        return None, None

def main():
    data_file_path = "src/data.js"
    if not os.path.exists(data_file_path):
        print(f"Erro: {data_file_path} não encontrado.")
        return

    # Ler dados de data.js
    with open(data_file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    json_str = content.split("=", 1)[1].strip().rstrip(";")
    db = json.loads(json_str)

    modificados = 0
    total = len(db)
    processed = 0

    print(f"Iniciando análise acústica dos áudios para {total} cantos...")

    for song_id, canto in db.items():
        processed += 1
        audio_url = canto.get("audio_url")
        if not audio_url:
            continue

        local_path = f"./public{audio_url}"
        if not os.path.exists(local_path):
            # Tentar relativo ao diretório
            local_path = f"public{audio_url}"

        if os.path.exists(local_path):
            print(f"[{processed}/{total}] Analisando {canto['titulo']} ({audio_url})...")
            detected_key, detected_bpm = analyze_audio_file(local_path)
            
            if detected_key and detected_bpm:
                # Salvar no registro se mudou ou não existia
                updated = False
                if canto.get("tom_audio") != detected_key:
                    canto["tom_audio"] = detected_key
                    updated = True
                if canto.get("bpm") != detected_bpm:
                    canto["bpm"] = detected_bpm
                    updated = True
                
                if updated:
                    modificados += 1
                    print(f"  -> Sincronizado: Tom={detected_key}, BPM={detected_bpm}")
        else:
            print(f"[{processed}/{total}] Áudio não encontrado localmente para: {canto['titulo']} ({local_path})")

    if modificados > 0:
        with open(data_file_path, "w", encoding="utf-8") as f:
            f.write("export const cantosData = ")
            json.dump(db, f, indent=2, ensure_ascii=False)
            f.write(";")
        print(f"\nConcluído! {modificados} cantos foram atualizados com tom_audio/bpm acústicos no data.js.")
    else:
        print("\nNenhum canto precisou ser atualizado ou nenhum áudio correspondente foi encontrado.")

if __name__ == "__main__":
    main()
