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

# Regex rigoroso para notação latina.
# Exigimos que comece com letra Maiúscula e minúscula (ex: Do, Re, Mi) 
# ou que tenha um modificador evidente (- , m, #, b, 7)
CHORD_PATTERN = re.compile(r'\b(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?(-|m|7)?\b', re.IGNORECASE)

# Palavras comuns em português que não queremos confundir se estiverem sozinhas sem modificador
COMMON_WORDS = ["do", "la", "a", "e", "o"]

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
        text = pytesseract.image_to_string(img, lang='por')
        
        # Pega apenas as primeiras 20 linhas
        lines = text.split('\n')[:20]
        for line in lines:
            # Pula linhas muito longas (provavelmente letras ou títulos)
            tokens = line.split()
            if len(tokens) > 4:
                continue
            
            for token in tokens:
                # Remove pontuações que o OCR possa ter grudado
                clean_token = re.sub(r'[^a-zA-Z0-9#-]', '', token)
                
                # match no pattern latino
                match = CHORD_PATTERN.fullmatch(clean_token)
                if match:
                    base = match.group(1).capitalize()
                    acidente = match.group(2) or ""
                    tipo = match.group(3) or ""
                    
                    chord_str = base + acidente + tipo
                    
                    # Se for apenas "Do" ou "La" (sem modificador) e estiver no meio de outras palavras, pode ser falso positivo
                    if chord_str.lower() in COMMON_WORDS and len(tokens) > 2:
                        continue # Provavelmente não é um acorde
                        
                    # Mantém a formatação original do Caminho Neocatecumenal (ex: La-, Re-)
                    return chord_str
        return "?"
    except Exception as e:
        print(f"Erro no OCR: {e}")
        return "?"

def main():
    data = read_data()
    total = len(data)
    modificados = 0
    
    print(f"Iniciando varredura OCR Tesseract AVANÇADA em {total} cantos...")
    
    for k, canto in data.items():
        # Vamos reprocessar TODOS para corrigir os errados (como "A", "E", "Do" falsos)
        img_urls = canto.get("imagens_originais", [])
        if img_urls:
            chord = extract_chord_from_image(img_urls[0])
            if chord != "?":
                print(f"[{canto['titulo']}] Corrigido para: {chord}")
                canto["tom_original"] = chord
                modificados += 1
            else:
                print(f"[{canto['titulo']}] Nenhum acorde detectado. Ficou: ?")
                canto["tom_original"] = "?"
                modificados += 1
            
    if modificados > 0:
        write_data(data)
        print(f"Sucesso! Tons corrigidos e salvos no data.js.")

if __name__ == '__main__':
    main()
