# NeoCat Transposer

🔗 **Acesse o site oficial:** [https://www.tomdosalmista.com.br/](https://www.tomdosalmista.com.br/)

Um sistema moderno e inteligente para auxiliar salmistas na descoberta do seu tom ideal e na transposição de cantos litúrgicos. O **NeoCat Transposer** é uma evolução do antigo Neo-Transposer, focado em facilidade de uso, IA e processamento em tempo real.

> **Créditos e Agradecimentos:** Este projeto nasceu inspirado no excelente e histórico projeto **[Neo-Transposer](https://github.com/vmas/neo-transposer)** (criado por Victor Mas e contribuidores). Todo o banco de dados oficial dos cantos, posições de capo ideais e lógicas fundamentais de limite de extensão vocal ("People-Compatible") derivam do trabalho fundamental feito na versão original. Nosso profundo reconhecimento à fundação deixada pelo Neo-Transposer.

## Recursos Principais

- **Visualizador de Cifras Dinâmicas:** Exibe letras de cantos com cifras incorporadas, permitindo transposição visual com apenas um clique (`+` ou `-`).
- **Ajuste Mágico de Tom:** Com base em um rápido processo de calibração vocal, o aplicativo descobre o tom ideal para a sua voz em cada canto específico, garantindo que você nunca precise forçar.
- **Salmista Assistente:** Um calibrador passo a passo, acompanhado de áudios (baseados na medição de *Iahweh* e *Se o Senhor não constrói a casa*), que calcula sua nota mais grave e mais aguda.
- **Monitoramento ao Vivo (Cantar Junto / Karaoke):** Modo de treinamento onde um gráfico dinâmico exibe a afinação da música em tempo real, capta sua voz pelo microfone, e compara ambas. Ele oferece feedback imediato (ex: "Cante mais Agudo") sincronizado com a transposição que você escolheu.
- **Shift Pitch de Áudio em Tempo Real:** Escute os áudios originais dos cantos automaticamente transpostos (via `tone.js`) para acompanhar o tom selecionado na cifra visual.
- **Geração de Cifra com IA:** Usando a integração com o Gemini, as páginas escaneadas dos livros são convertidas em cifras interativas instantaneamente.

## Como Rodar

O sistema possui duas camadas que operam simultaneamente: o Frontend (React + Vite) e o Backend de Inteligência Artificial (FastAPI).

### 1. Iniciar o Frontend (Interface)
1. Certifique-se de ter o `Node.js` instalado.
2. Na raiz do projeto, instale as dependências:
   ```bash
   npm install
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. O app ficará disponível em `http://localhost:5173`.

### 2. Scripts e Backend AI
Os arquivos Python do projeto foram organizados na pasta `scripts/`.
1. Certifique-se de ter o Python 3 instalado.
2. O servidor depende do pacote de IA do Google, librosa, e do FastAPI. Instale se não os tiver:
   ```bash
   pip3 install fastapi uvicorn requests librosa numpy
   ```
3. O comando `npm run dev` já iniciará automaticamente o servidor em `scripts/ai_server.py` rodando na porta `8000`.
4. Para gerar os dados de afinação (Karaoke) para todos os áudios, rode:
   ```bash
   python3 scripts/generate_pitch_data.py
   ```

*Lembre-se de definir a variável de ambiente `GEMINI_API_KEY` para as funções de Digitalização com IA.*

## Tecnologias

- **Vite + React.js** para interface rápida.
- **Tone.js** para análise acústica e manipulação de Pitch Shift (mudança de tom no áudio original) no navegador.
- **Python (FastAPI & Librosa)** como backend para extração de áudios, análise de pitch (frequência fundamental) e proxy.
- **Google Gemini API** para transcrição avançada de partituras para nosso formato inteligente `[Acorde]Texto`.
