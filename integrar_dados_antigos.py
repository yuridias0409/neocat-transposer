import json
import re
import csv
from io import StringIO
import math
import unicodedata
import os

NOTES = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
}

def note_to_freq(note_str):
    if not note_str or note_str == 'NULL':
        return None
        
    note_str = note_str.strip().upper()
    if len(note_str) < 2:
        return None
        
    octave_str = note_str[-1]
    if not octave_str.isdigit():
        return None
        
    octave = int(octave_str)
    pitch_class = note_str[:-1]
    
    if pitch_class not in NOTES:
        return None
        
    semitones_from_c0 = octave * 12 + NOTES[pitch_class]
    # A4 is C0 + 4 octaves + 9 semitones = 57 semitones
    semitones_from_a4 = semitones_from_c0 - 57
    
    freq = 440.0 * math.pow(2.0, semitones_from_a4 / 12.0)
    return round(freq, 2)

def normalize_title(t):
    if not t: return ""
    t = unicodedata.normalize('NFKD', t).encode('ASCII', 'ignore').decode('utf-8')
    t = t.lower()
    t = re.sub(r'[^a-z0-9]', '', t)
    return t

def parse_sql():
    sql_path = '../neo-transposer-old/song_data.sql'
    if not os.path.exists(sql_path):
        print(f"Erro: {sql_path} não encontrado.")
        return []
        
    with open(sql_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches INSERT INTO `song` VALUES (..., ...);
    # Since some inserts might span multiple lines or be grouped, we use a regex that captures the tuples
    inserts = re.findall(r"INSERT INTO `song` VALUES \((.*?)\);", content, re.MULTILINE | re.DOTALL)
    
    songs_data = []
    for insert in inserts:
        try:
            reader = csv.reader(StringIO(insert), quotechar="'", skipinitialspace=True)
            row = next(reader)
            
            if len(row) >= 10 and row[1] == '4': # id_book = 4 is Portuguese
                songs_data.append({
                    'title': row[3],
                    'lowest_note': row[4],
                    'highest_note': row[5],
                    'people_lowest_note': row[8] if row[8] != 'NULL' else None,
                    'people_highest_note': row[9] if row[9] != 'NULL' else None,
                })
        except Exception as e:
            continue
            
    return songs_data

def main():
    songs_data = parse_sql()
    print(f"Encontrados {len(songs_data)} cantos em Português no repositório antigo.")
    
    data_path = "src/data.js"
    with open(data_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    json_str = content.split("=", 1)[1].strip().rstrip(";")
    db = json.loads(json_str)
    
    # Create lookup map for old songs
    old_songs_map = {}
    for s in songs_data:
        norm = normalize_title(s['title'])
        old_songs_map[norm] = s
        
    modificados = 0
    for key, canto in db.items():
        norm = normalize_title(canto['titulo'])
        if norm in old_songs_map:
            old_s = old_songs_map[norm]
            
            f_min = note_to_freq(old_s['lowest_note'])
            f_max = note_to_freq(old_s['highest_note'])
            f_pmin = note_to_freq(old_s['people_lowest_note'])
            f_pmax = note_to_freq(old_s['people_highest_note'])
            
            if f_min: canto['freq_min_curada'] = f_min
            if f_max: canto['freq_max_curada'] = f_max
            if f_pmin: canto['freq_min_povo_curada'] = f_pmin
            if f_pmax: canto['freq_max_povo_curada'] = f_pmax
            
            modificados += 1
            print(f"Merge de dados vocais em: {canto['titulo']} (Max: {f_max}Hz | Povo: {f_pmax}Hz)")
            
    with open(data_path, "w", encoding="utf-8") as f:
        f.write("export const cantosData = ")
        json.dump(db, f, indent=2, ensure_ascii=False)
        f.write(";\n")
        
    print(f"\nSucesso! {modificados} cantos foram atualizados com os dados vocais precisos do repositório antigo.")

if __name__ == "__main__":
    main()
