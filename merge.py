import json

with open("src/data_gen.js", "r") as f:
    text = f.read()
    json_str = text.split("=", 1)[1].strip().rstrip(";")
    data_gen = json.loads(json_str)

# The 4 transcribed songs we want to keep
transcribed = {
  "ressuscitou": {
    "id": "ressuscitou",
    "titulo": "Ressuscitou",
    "etapa": "Pré-Catecumenato",
    "cor": "branco",
    "tom_original": "Am",
    "tom_audio": "Am",
    "bpm": 110,
    "audio_url": "/audios/Ressuscitou.mp3",
    "linhas": [
      { "id": 1, "texto": "Ressuscitou, ressuscitou, ressuscitou, aleluia!", "cifra": "[Am] Ressuscitou, [G] ressuscitou, [F] ressuscitou, a[E]leluia!", "pico_agudo": True, "freq_max": 329 },
      { "id": 2, "texto": "Aleluia, aleluia, aleluia, ressuscitou!", "cifra": "[Am] Aleluia, a[G]leluia, a[F]leluia, res[E]suscitou!", "pico_agudo": True, "freq_max": 329 },
      { "id": 3, "texto": "", "cifra": "", "freq_max": 0 },
      { "id": 4, "texto": "A morte", "cifra": "A [Am] morte", "freq_max": 200 },
      { "id": 5, "texto": "Onde está a morte?", "cifra": "Onde [G] está a morte?", "freq_max": 220 },
      { "id": 6, "texto": "Onde está a minha morte?", "cifra": "Onde es[F]tá a minha morte?", "freq_max": 200 },
      { "id": 7, "texto": "Onde está a sua vitória?", "cifra": "Onde es[E]tá a sua vitória?", "freq_max": 329 }
    ]
  },
  "se-o-senhor-nao-constroi-a-casa": {
    "id": "se-o-senhor-nao-constroi-a-casa",
    "titulo": "Se o Senhor não constrói a casa",
    "etapa": "Pré-Catecumenato",
    "cor": "branco",
    "tom_original": "C",
    "tom_audio": "C",
    "bpm": 90,
    "audio_url": "/audios/Se-o-Senhor-nao-constroi.mp3",
    "linhas": [
      { "id": 1, "texto": "SE O SENHOR NÃO CONSTRÓI A CASA", "cifra": "SE O SE[C]NHOR NÃO CONS[Am]TRÓI A [F] CASA", "pico_agudo": True, "freq_max": 392 },
      { "id": 2, "texto": "EM VÃO TRABALHAM OS CONSTRUTORES", "cifra": "EM VÃO TRABA[G]LHAM OS CONSTRUTO[C]RES", "freq_max": 349 },
      { "id": 3, "texto": "SE O SENHOR NÃO GUARDA A CIDADE", "cifra": "SE O SE[C]NHOR NÃO [Am] GUARDA A CI[F]DADE", "pico_agudo": True, "freq_max": 392 },
      { "id": 4, "texto": "EM VÃO VIGIAM AS SENTINELAS", "cifra": "EM VÃO VI[G]GIAM AS SENTINE[C]LAS", "freq_max": 349 },
      { "id": 5, "texto": "", "cifra": "", "freq_max": 0 },
      { "id": 6, "texto": "É inútil que madrugueis", "cifra": "É i[Am]nútil que madrugueis", "freq_max": 220 },
      { "id": 7, "texto": "e que atraseis o vosso descanso", "cifra": "e que atra[G]seis o vosso des[Am]canso", "freq_max": 261 },
      { "id": 8, "texto": "para comer o pão de vossos suores", "cifra": "para co[G]mer o pão de vossos su[Am]ores", "freq_max": 261 },
      { "id": 9, "texto": "pois Ele o dá aos Seus amigos", "cifra": "pois Ele o [G] dá aos Seus ami[E]gos", "freq_max": 329 },
      { "id": 10, "texto": "enquanto dormem.", "cifra": "enquanto [Am] dormem.", "freq_max": 220 }
    ]
  },
  "eu-te-amo-senhor": {
    "id": "eu-te-amo-senhor",
    "titulo": "Eu te amo, Senhor",
    "etapa": "Pré-Catecumenato",
    "cor": "branco",
    "tom_original": "Am",
    "tom_audio": "Am",
    "bpm": 80,
    "audio_url": "/audios/Eu-te-amo-Senhor.mp3",
    "linhas": [
      { "id": 1, "texto": "Eu te amo, Senhor", "cifra": "Eu te [Am] amo, Senhor", "freq_max": 200 },
      { "id": 2, "texto": "tu és a minha força,", "cifra": "tu [Dm] és a minha força,", "freq_max": 220 },
      { "id": 3, "texto": "meu rochedo,", "cifra": "meu ro[E]chedo,", "freq_max": 329 },
      { "id": 4, "texto": "minha fortaleza", "cifra": "[Am] minha fortaleza", "freq_max": 200 },
      { "id": 5, "texto": "e meu libertador.", "cifra": "e meu liberta[Dm]dor. [Am] [E7] [Am]", "freq_max": 220 },
      { "id": 6, "texto": "", "cifra": "", "freq_max": 0 },
      { "id": 7, "texto": "Meu Deus é o meu rochedo", "cifra": "Meu [C] Deus é o meu rochedo", "freq_max": 261 },
      { "id": 8, "texto": "nele me refugio;", "cifra": "nele me refu[G]gio;", "freq_max": 293 },
      { "id": 9, "texto": "é o meu escudo,", "cifra": "é o [C] meu escudo,", "freq_max": 261 },
      { "id": 10, "texto": "a força que me salva", "cifra": "a [Dm] força que me salva", "freq_max": 220 },
      { "id": 11, "texto": "e o meu baluarte.", "cifra": "e o meu balu[E]arte. [E7]", "freq_max": 329 }
    ]
  },
  "dizei-aos-de-coracao-cansado": {
    "id": "dizei-aos-de-coracao-cansado",
    "titulo": "Dizei aos de coração cansado",
    "etapa": "Pré-Catecumenato",
    "cor": "branco",
    "tom_original": "Am",
    "tom_audio": "Am",
    "bpm": 75,
    "audio_url": "/audios/Dizei-aos-de-coracao-cansado.mp3",
    "linhas": [
      { "id": 1, "texto": "Dizei aos de coração cansado:", "cifra": "Di[Am]zei aos de coração cansa[E]do:", "freq_max": 329 },
      { "id": 2, "texto": "coragem, não temais!", "cifra": "[Am] coragem, não te[E]mais!", "freq_max": 329 },
      { "id": 3, "texto": "Aí está o vosso Deus", "cifra": "A[Am]í está o vosso Deus", "freq_max": 200 },
      { "id": 4, "texto": "Aí está o vosso Deus", "cifra": "A[Dm]í está o vosso Deus", "freq_max": 220 },
      { "id": 5, "texto": "Vem para nos salvar", "cifra": "Vem [E] para nos sal[Am]var", "freq_max": 329 },
      { "id": 6, "texto": "", "cifra": "", "freq_max": 0 },
      { "id": 7, "texto": "Então se abrirão os olhos dos cegos", "cifra": "En[A7]tão se abrirão os olhos dos [Dm] cegos", "freq_max": 293 },
      { "id": 8, "texto": "os ouvidos dos surdos se abrirão", "cifra": "os ou[G]vidos dos surdos se abri[C]rão", "freq_max": 392 },
      { "id": 9, "texto": "Então saltará o coxo como um cervo", "cifra": "En[F]tão saltará o coxo como um [Dm] cervo", "freq_max": 349 },
      { "id": 10, "texto": "E a língua do mudo cantará", "cifra": "E a [E] língua do mudo canta[Am]rá", "freq_max": 329 }
    ]
  },
  "abraao": {
    "id": "abraao",
    "titulo": "Abraão",
    "etapa": "Pré-Catecumenato",
    "cor": "branco",
    "tom_original": "Am",
    "tom_audio": "Am",
    "bpm": 85,
    "audio_url": "/audios/Abraao.mp3",
    "linhas": [
      { "id": 1, "texto": "Fazia calor naquele dia", "cifra": "[Am] Fazia calor naquele dia", "freq_max": 180 }
    ]
  }
}

for k, v in transcribed.items():
    if k in data_gen:
        # keep images, overwrite lines and audio
        v["imagens_originais"] = data_gen[k].get("imagens_originais", [])
    data_gen[k] = v

with open("src/data.js", "w", encoding="utf-8") as f:
    f.write("export const cantosData = ")
    json.dump(data_gen, f, indent=2, ensure_ascii=False)
    f.write(";")
