import json
import os
import glob
import unicodedata
import re

DATA_FILE = "src/data.js"
AUDIO_DIR = "public/audios"

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def slugify(text):
    text = remove_accents(text).lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def main():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    json_str = content.split("=", 1)[1].strip().rstrip(";")
    data = json.loads(json_str)
    
    slug_to_id = {}
    for k, v in data.items():
        slug = slugify(v['titulo'])
        slug_to_id[slug] = k
        slug_to_id[k] = k
        
    mp3_files = glob.glob(f"{AUDIO_DIR}/*.mp3")
    modificados = 0
    
    for mp3_path in mp3_files:
        filename = os.path.basename(mp3_path)
        name_without_ext = os.path.splitext(filename)[0]
        slug = slugify(name_without_ext)
        
        canto_id = slug_to_id.get(slug)
        if not canto_id:
            slug_clean = slug.replace('-ok', '').replace('-temporario', '')
            canto_id = slug_to_id.get(slug_clean)
            
        if canto_id:
            url = f"/audios/{filename}"
            if data[canto_id].get("audio_url") != url:
                data[canto_id]["audio_url"] = url
                modificados += 1

    if "a-cabana-dos-pastores" in data:
        data["a-cabana-dos-pastores"]["tom_original"] = "Re-"
        modificados += 1

    if modificados > 0:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            f.write("export const cantosData = ")
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write(";")
        print(f"Sucesso! {modificados} modificacoes feitas.")

if __name__ == '__main__':
    main()
