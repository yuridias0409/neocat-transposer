import re
import json

SQL_FILE = "/tmp/neo-transposer/song_data.sql"
DATA_FILE = "src/data.js"

def normalize_title(title):
    import unicodedata
    nfkd = unicodedata.normalize('NFKD', title)
    clean = u"".join([c for c in nfkd if not unicodedata.combining(c)])
    clean = re.sub(r'[^a-zA-Z0-9 ]', '', clean)
    return clean.lower().strip()

def main():
    songs_pt = {}
    with open(SQL_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith("INSERT INTO `song` VALUES"):
                match = re.search(r"INSERT INTO `song` VALUES \(([^,]+),([^,]+),([^,]+),'([^']+)'", line)
                if match:
                    id_song = match.group(1)
                    id_book = match.group(2)
                    title = match.group(4)
                    if id_book == '4':
                        songs_pt[id_song] = title

    chords_pt = {}
    with open(SQL_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith("INSERT INTO `song_chord` VALUES"):
                tuples = re.findall(r"\((\d+),'([^']+)',(\d+)\)", line)
                for t in tuples:
                    id_song, chord, pos = t
                    if id_song in songs_pt:
                        # POSITION 0 É O PRIMEIRO ACORDE DO CANTO!
                        if id_song not in chords_pt or int(pos) == 0:
                            chords_pt[id_song] = chord
                            
    title_to_chord = {}
    for id_song, title in songs_pt.items():
        if id_song in chords_pt:
            title_to_chord[normalize_title(title)] = chords_pt[id_song]

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    json_str = content.split("=", 1)[1].strip().rstrip(";")
    data = json.loads(json_str)
    
    modificados = 0
    from format_data_br import translate_chord
    
    for k, canto in data.items():
        title_norm = normalize_title(canto['titulo'])
        if title_norm in title_to_chord:
            correct_chord_american = title_to_chord[title_norm]
            correct_chord_br = translate_chord(correct_chord_american)
            
            if canto.get("tom_original") != correct_chord_br:
                canto["tom_original"] = correct_chord_br
                modificados += 1
                
    if modificados > 0:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            f.write("export const cantosData = ")
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write(";")
        print(f"Sucesso! {modificados} cantos corrigidos com dados oficiais do Neo-Transposer (Posição 0).")

if __name__ == '__main__':
    main()
