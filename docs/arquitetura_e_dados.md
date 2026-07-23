# Arquitetura e Estrutura de Dados

## Visão Geral da Arquitetura

O **Neocat Transposer** é dividido em duas camadas principais:

1. **Frontend (Vite + React)**
   - Hospedado estaticamente ou rodando localmente via `npm run dev`.
   - Responsável pela renderização de cifras, execução de áudios (Tone.js), interface do usuário, e cálculo em tempo real de pitch de microfone (Pitchy).
   - O armazenamento de preferências (tons, login) usa Firebase (via `src/dao`).

2. **Backend (Python + FastAPI) [Opcional para uso diário, vital para IA]**
   - Roda via `scripts/ai_server.py`.
   - Provê serviços avançados como OCR musical (via Gemini) para criar novos cantos a partir de imagens.

## Estrutura de Pastas (`src/`)

- `assets/`: Imagens estáticas (ex: ícone do capotraste).
- `components/`: Componentes reutilizáveis isolados (ex: Navbar).
- `controllers/`: Hooks complexos de React que atuam como "Controllers" no modelo MVC (ex: `useCantoController.js`).
- `dao/`: Padrão Data Access Object. Gerencia acesso a dados de Cantos (local) e de Usuários/Autenticação (Firebase).
- `utils/`: Motores de cálculo (capotraste, transposição inteligente) genéricos.
- `views/`: Telas (Pages) e seus subcomponentes.

## Dicionário de Dados: `data.js`

O arquivo `src/data.js` exporta a constante `cantosData`, que é um dicionário (chave-valor) onde a chave é o `id` do canto, e o valor é o objeto do canto.

### Estrutura de um Canto (`CantoObject`)

```json
{
  "senhor-nao-me-corrijas": {
    "id": "senhor-nao-me-corrijas",           // String única, geralmente o título kebab-case
    "titulo": "Senhor, não me corrijas...", // Título legível
    "etapa": "Pré-Catecumenato",            // Etapa do caminho (ex: Liturgia, Eleição)
    "cor": "branco",                        // Cor da página no livro
    "tom_original": "Fa#",                  // Tom padrão escrito no livro
    "tom_audio": "Fa#",                     // Tom real do arquivo .mp3 (pode divergir do livro)
    "bpm": 152,                             // Batidas por minuto
    "audio_url": "/audios/Senhor.mp3",      // Caminho relativo para o áudio
    "linhas": [],                           // Array de strings com cifra e letra misturadas (gerado pela IA)
    "imagens_originais": [                  // URLs ou caminhos das fotos originais do livro
      "https://cn.org.br/.../image.png"
    ],
    "acordes_usados": ["Fa#", "Sol"],       // Lista de acordes presentes no canto para gerar o guia visual
    "freq_max_global": 291.14,              // (Opcional/Gerado) Metadados de análise de frequencia
    "freq_min_curada": 69.3,
    "freq_max_curada": 185.0
  }
}
```

### Como adicionar um novo canto manualmente
1. Crie o arquivo `.mp3` e coloque na pasta `/public/audios/`.
2. Adicione a chave correspondente no `src/data.js`.
3. Preencha pelo menos `id`, `titulo`, `tom_original`, `tom_audio`, e `imagens_originais`.
4. (Opcional) Gere os dados dinâmicos rodando o `scripts/generate_pitch_data.py`.
