import os
import io
import librosa
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AudioAnalysisRequest(BaseModel):
    audio_path: str  # e.g., "/audios/Ressuscitou.mp3"

PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def get_key_from_chromagram(chromagram):
    """
    Very basic template-matching to detect Major/Minor keys from a chromagram.
    """
    # Sum chroma over time
    chroma_sum = np.sum(chromagram, axis=1)
    
    # Krumhansl-Schmuckler key profiles
    maj_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
    min_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
    
    maj_profile = np.array(maj_profile)
    min_profile = np.array(min_profile)
    
    # Compute correlations for all 12 shifts
    maj_corrs = []
    min_corrs = []
    for i in range(12):
        shifted_chroma = np.roll(chroma_sum, -i)
        maj_corrs.append(np.corrcoef(maj_profile, shifted_chroma)[0,1])
        min_corrs.append(np.corrcoef(min_profile, shifted_chroma)[0,1])
        
    best_maj_idx = np.argmax(maj_corrs)
    best_min_idx = np.argmax(min_corrs)
    
    if maj_corrs[best_maj_idx] > min_corrs[best_min_idx]:
        return PITCH_CLASS_NAMES[best_maj_idx] # Major (e.g. "C")
    else:
        return PITCH_CLASS_NAMES[best_min_idx] + "m" # Minor (e.g. "Am")

@app.post("/analyze-song")
async def analyze_song(req: AudioAnalysisRequest):
    # Construct the full local path from the react public folder
    # Assuming ai_server.py is running in Cantos/salmistas-app
    local_path = f"./public{req.audio_path}"
    
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="Audio file not found in public folder")
    
    try:
        # Load audio (load only first 60 seconds to save time for key detection)
        y, sr = librosa.load(local_path, duration=60.0)
        
        # 1. Extract BPM (Tempo)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo[0]) if isinstance(tempo, np.ndarray) else float(tempo)
        
        # 2. Extract Key
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key = get_key_from_chromagram(chroma)
        
        return {
            "status": "success",
            "key": key,
            "bpm": round(bpm),
            "audio_url": req.audio_path
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/proxy-audio")
async def proxy_audio(url: str):
    import requests
    from fastapi.responses import StreamingResponse
    try:
        # Fazemos o download da música em tempo real e repassamos pro frontend
        # burlado o CORS original do cn.org.br
        req = requests.get(url, stream=True)
        return StreamingResponse(
            req.iter_content(chunk_size=1024), 
            media_type=req.headers.get("Content-Type", "audio/mpeg")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GenerateCifraRequest(BaseModel):
    id_canto: str
    images: list[str]

@app.post("/generate-cifra")
async def generate_cifra(req: GenerateCifraRequest):
    import requests
    import json
    import base64
    
    parts = []
    
    prompt = """Você é um especialista em transcrição de partituras e cifras.
Eu vou te fornecer imagens de páginas de um livro de cantos litúrgicos. 
Sua tarefa é extrair a letra completa e os acordes (cifra) exatamente como aparecem na imagem, mas em um formato de texto estruturado.

REGRAS ESTRITAS:
1. Para cada acorde musical encontrado acima da letra, insira-o IMEDIATAMENTE ANTES da sílaba ou palavra onde ele deve ser tocado, no formato [Acorde]. Exemplo: "[Re-]A cabana dos [La-]pastores..."
2. Respeite as quebras de linha e estrofes.
3. Se a imagem contiver apenas partitura instrumental (sem letra), ignore.
4. Você deve retornar EXCLUSIVAMENTE um JSON válido com o seguinte formato:
{
  "linhas": [
    {"texto": "texto da linha 1 com [Acordes] embutidos"},
    {"texto": "texto da linha 2 com [Acordes] embutidos"}
  ]
}
5. O nome dos acordes deve seguir o padrão latino da imagem (Do, Re, Mi, Fa, Sol, La, Si), acompanhados dos sustenidos/bemóis ou sétimas se houver (ex: Sol7, Mi-, Fa#). Mantenha EXATAMENTE o que está na imagem.
6. IMPORTANTE: Não inclua marcação markdown (`json`) no retorno, apenas retorne o JSON puro.
"""
    
    images_b64 = []
    for img_path in req.images:
        local_path = f"./public{img_path}"
        if not os.path.exists(local_path):
            continue
            
        with open(local_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode('utf-8')
            images_b64.append(b64_data)
            
    payload = {
        "model": "llava",
        "prompt": prompt,
        "images": images_b64,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1
        }
    }
    
    url = "http://localhost:11434/api/generate"
    try:
        resp = requests.post(url, json=payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao conectar com Ollama. Verifique se ele está rodando (ollama run llava). Erro: {str(e)}")
    
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Erro da API Ollama: {resp.text}")
        
    try:
        data = resp.json()
        response_text = data.get('response', '')
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
            
        json_parsed = json.loads(response_text.strip())
        linhas_geradas = json_parsed.get("linhas", [])
        
        # Injetar em data.js
        with open("src/data.js", "r", encoding="utf-8") as f:
            data_js_content = f.read()
            
        json_str = data_js_content.split("=", 1)[1].strip().rstrip(";")
        db = json.loads(json_str)
        
        if req.id_canto in db:
            db[req.id_canto]["linhas"] = linhas_geradas
            
            with open("src/data.js", "w", encoding="utf-8") as f:
                f.write("export const cantosData = ")
                json.dump(db, f, indent=2, ensure_ascii=False)
                f.write(";")
                
            return {"status": "success", "linhas": linhas_geradas}
        else:
            raise HTTPException(status_code=404, detail="Canto não encontrado no data.js")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar JSON: {str(e)}\nResponse: {resp.text if 'resp' in locals() else ''}")

if __name__ == "__main__":
    print("🚀 Iniciando Salmistas AI Server (Porta 8000)...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

