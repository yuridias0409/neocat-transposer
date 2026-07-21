import json
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

CATEGORIAS = [
    {"url": "https://cn.org.br/portal/ressuscitou-pre-catecumenato/", "etapa": "Pré-Catecumenato", "cor": "branco"},
    {"url": "https://cn.org.br/portal/ressuscitou-catecumenato/", "etapa": "Catecumenato", "cor": "azul"},
    {"url": "https://cn.org.br/portal/ressuscitou-eleicao/", "etapa": "Eleição", "cor": "verde"},
    {"url": "https://cn.org.br/portal/ressuscitou-liturgia/", "etapa": "Liturgia", "cor": "amarelo"}
]

blocklist = [
    "/tag/", "/category/", "/author/", "/page/", "/institucional/", 
    "/inicio-do-caminho", "/palavra-dos-papas", "/noticias/", 
    "/carmen-hernandez/", "/livros/", "/ressuscitou/", "/contato/"
]

def fetch_song_data(url, etapa, cor):
    try:
        resp = requests.get(url, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Titulo
        title_tag = soup.find("h1")
        titulo = title_tag.text.strip() if title_tag else url.split("/")[-2].replace("-", " ").title()
        
        # Id
        id_str = url.split("/")[-2]
        
        # Imagens
        figures = soup.find_all("figure", class_="wp-block-image")
        imagens = []
        for fig in figures:
            img_tag = fig.find("img")
            if img_tag and img_tag.get("src"):
                imagens.append(img_tag["src"])
                
        return {
            "id": id_str,
            "titulo": titulo,
            "etapa": etapa,
            "cor": cor,
            "tom_original": "?",
            "tom_audio": "",
            "bpm": 0,
            "audio_url": "",
            "linhas": [],
            "imagens_originais": imagens
        }
    except Exception as e:
        print(f"Erro {url}: {e}")
        return None

def main():
    todas_musicas = {}
    
    for cat in CATEGORIAS:
        print(f"Buscando categoria: {cat['etapa']}")
        resp = requests.get(cat["url"], timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        links = []
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            if "cn.org.br/portal/" in href and href != cat["url"] and href != "https://cn.org.br/portal/":
                if not any(blocked in href for blocked in blocklist):
                    links.append(href)
        
        links = list(set(links)) # remove duplicates
        print(f"Encontrados {len(links)} links para {cat['etapa']}. Baixando meta...")
        
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(fetch_song_data, l, cat["etapa"], cat["cor"]) for l in links]
            for future in as_completed(futures):
                res = future.result()
                if res and res["imagens_originais"]:
                    todas_musicas[res["id"]] = res
                    
    # Generate JS file
    with open("src/data_gen.js", "w", encoding="utf-8") as f:
        f.write("export const cantosData = ")
        json.dump(todas_musicas, f, indent=2, ensure_ascii=False)
        f.write(";")
    print(f"Pronto! {len(todas_musicas)} cantos salvos em src/data_gen.js")

if __name__ == '__main__':
    main()
