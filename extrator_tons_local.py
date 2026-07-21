import json
import re
import requests
import io
from PIL import Image
try:
    import pytesseract
except ImportError:
    print("ERRO: Instale as bibliotecas executando:")
    print("pip3 install pytesseract Pillow requests --break-system-packages")
    print("E garanta que o tesseract está instalado no Mac: brew install tesseract")
    exit(1)

DATA_FILE = "src/data.js"

# Regex para acordes do Neocatecumenato (padrão latino e cifras normais)
# Pode ser algo como: Am, Rem, DO, Mi, SOL, Re-, Sol-, Lam, La-
CHORD_PATTERN = re.compile(r'\b([A-G][#b]?[m]?\d?|Do|Re|Mi|Fa|Sol|La|Si|Do-|Re-|Mi-|Fa-|Sol-|La-|Si-|Dom|Rem|Mim|Fam|Solm|Lam|Sim)\b', re.IGNORECASE)

def read_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    json_str = content.split("=", 1)[1].strip().rstrip(";")
    return json.loads(json_str)

def write_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write("export const cantosData = ")
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write(";")

def extract_chord_from_image(img_url):
    try:
        resp = requests.get(img_url, timeout=10)
        img = Image.open(io.BytesIO(resp.content))
        # Extrair texto com Tesseract
        text = pytesseract.image_to_string(img, lang='por') # Tenta usar português
        
        # Pega apenas as primeiras 15 linhas (onde ficam os acordes no começo do canto)
        lines = text.split('\n')[:15]
        for line in lines:
            matches = CHORD_PATTERN.findall(line)
            if matches:
                # Retorna o primeiro acorde detectado na linha superior
                chord = matches[0].capitalize()
                # Normaliza para notação padrão se for latino com traço
                chord = chord.replace("-", "m")
                return chord
        return "?"
    except Exception as e:
        print(f"Erro no OCR da imagem {img_url}: {e}")
        return "?"

def main():
    data = read_data()
    total = len(data)
    count = 0
    modificados = 0
    
    print(f"Iniciando varredura OCR Tesseract em {total} cantos...")
    
    for k, canto in data.items():
        count += 1
        if canto.get("tom_original") == "?":
            img_urls = canto.get("imagens_originais", [])
            if img_urls:
                print(f"[{count}/{total}] Lendo '{canto['titulo']}'...")
                chord = extract_chord_from_image(img_urls[0])
                if chord != "?":
                    print(f"  -> Acorde detectado: {chord}")
                    canto["tom_original"] = chord
                    modificados += 1
                else:
                    print(f"  -> Nenhum acorde detectado com confiança.")
            
    if modificados > 0:
        write_data(data)
        print(f"Sucesso! {modificados} novos tons salvos no data.js.")
    else:
        print("Nenhum tom novo foi extraído.")

if __name__ == '__main__':
    main()
