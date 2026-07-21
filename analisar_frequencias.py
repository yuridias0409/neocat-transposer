import json
import librosa
import numpy as np
import os
import sys

def get_max_freq(audio_path):
    try:
        # Carrega 60 segundos do áudio para ser mais rápido (geralmente pega refrão e estrofe)
        y, sr = librosa.load(audio_path, sr=None, duration=60.0)
        
        rms = librosa.feature.rms(y=y)[0]
        f0 = librosa.yin(y, fmin=80, fmax=800, sr=sr)
        
        min_len = min(len(rms), len(f0))
        rms = rms[:min_len]
        f0 = f0[:min_len]
        
        # Filtra momentos de silêncio (mantém apenas onde o volume é > 10% do volume máximo)
        threshold = 0.1 * np.max(rms)
        f0_voiced = f0[rms > threshold]
        
        if len(f0_voiced) == 0:
            return 0
            
        # Pega o percentil 95 para ignorar ruídos muito agudos acidentais
        max_freq = np.percentile(f0_voiced, 95)
        return float(max_freq)
    except Exception as e:
        print(f"Erro em {audio_path}: {e}")
        return 0

def main():
    data_path = "src/data.js"
    if not os.path.exists(data_path):
        print(f"Erro: {data_path} não encontrado.")
        sys.exit(1)

    print("Lendo banco de dados...")
    with open(data_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    json_str = content.split("=", 1)[1].strip().rstrip(";")
    db = json.loads(json_str)
    
    modificados = 0
    total = len(db)
    i = 0
    
    print(f"Iniciando verificação de {total} cantos...")
    
    for key, canto in db.items():
        i += 1
        if "audio_url" not in canto or not canto["audio_url"]:
            continue
            
        if "freq_max_global" in canto and canto["freq_max_global"] > 0:
            continue
            
        audio_local = f"./public{canto['audio_url']}"
        if not os.path.exists(audio_local):
            continue
            
        print(f"[{i}/{total}] Analisando frequências de: {canto['titulo']}")
        freq = get_max_freq(audio_local)
        
        if freq > 0:
            canto["freq_max_global"] = round(freq, 2)
            modificados += 1
            print(f"  -> Max Freq: {canto['freq_max_global']} Hz")
            
            # Salva gradualmente para não perder progresso
            with open(data_path, "w", encoding="utf-8") as f:
                f.write("export const cantosData = ")
                json.dump(db, f, indent=2, ensure_ascii=False)
                f.write(";\n")
                
    print(f"\nConcluído! {modificados} cantos foram atualizados com a frequência máxima (freq_max_global).")

if __name__ == "__main__":
    main()
