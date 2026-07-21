import json
import re

DATA_FILE = "src/data.js"

american_to_latin = {
  'C': 'Do', 'C#': 'Do#', 'Db': 'Do#',
  'D': 'Re', 'D#': 'Re#', 'Eb': 'Re#',
  'E': 'Mi',
  'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Fa#',
  'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Sol#',
  'A': 'La', 'A#': 'La#', 'Bb': 'La#',
  'B': 'Si'
}

def translate_chord(chord_str):
    if chord_str == "?": return "?"
    
    # Busca a base e as extensões
    match = re.match(r'^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])([#b]?)(m|-)?(.*)', chord_str, re.IGNORECASE)
    if not match: return chord_str
    
    base = match.group(1)
    if len(base) == 1: base = base.upper()
    else: base = base.capitalize()
        
    acc = match.group(2) or ""
    mod = match.group(3) or ""
    ext = match.group(4) or ""
    
    note = base + acc
    if note in american_to_latin:
        note = american_to_latin[note]
        
    if mod == "m":
        mod = "-"
        
    return note + mod + ext

def main():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    json_str = content.split("=", 1)[1].strip().rstrip(";")
    data = json.loads(json_str)
    
    modificados = 0
    for k, canto in data.items():
        original = canto.get("tom_original")
        if original and original != "?":
            translated = translate_chord(original)
            if original != translated:
                print(f"[{canto['titulo']}] {original} -> {translated}")
                canto["tom_original"] = translated
                modificados += 1
                
    if modificados > 0:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            f.write("export const cantosData = ")
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write(";")
        print(f"Sucesso! {modificados} acordes convertidos para o padrão Latino/BR.")
    else:
        print("Todos os acordes já estão no padrão BR.")

if __name__ == '__main__':
    main()
