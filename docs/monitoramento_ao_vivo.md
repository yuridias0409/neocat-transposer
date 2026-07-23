# Monitoramento ao Vivo (Modo Karaoke)

O recurso de **Monitoramento ao Vivo** (Cantar Junto) permite que o salmista acompanhe a afinação original do canto enquanto recebe feedback visual e em tempo real sobre sua própria afinação, através do microfone.

## Visão Geral da Arquitetura

1. **Extração de Afinação Offline (Backend/Python)**
   A afinação exata da música original precisa ser extraída dos áudios `.mp3` para servir de gabarito para a comparação com a voz do usuário. 
   - **Script:** `scripts/generate_pitch_data.py`
   - **Biblioteca:** `librosa` (especificamente o algoritmo `yin`, que é otimizado para rastreamento rápido e preciso de frequências fundamentais em sinais monofônicos).
   - **Armazenamento:** O script gera arquivos estáticos `.json` salvos em `public/pitch_data/`. Cada arquivo contém um array de pares `{t: tempo, f: frequência em Hz}` com precisão de décimos de segundo.

2. **Carregamento Assíncrono (Frontend)**
   Quando o usuário clica em **Cante junto**, o `useCantoController.js` faz o fetch imediato do JSON estático correspondente da pasta `pitch_data`. Isso evita chamadas pesadas ao backend e economiza processamento e custos de banco de dados, entregando os dados instantaneamente.

3. **Renderização Visual no Canvas (Frontend)**
   O componente `KaraokePanelView.jsx` é responsável por renderizar o gráfico em tempo real a 60 FPS (via `requestAnimationFrame`).
   - O gráfico desliza automaticamente exibindo 1.5s do passado e 3s do futuro.
   - O eixo Y não usa uma escala linear de Hertz, mas sim uma **Escala de Semitons** logarítmica (baseada na fórmula `12 * log2(Hz / 440)`). Isso garante que o salto visual de um *Dó* para um *Fá* pareça o mesmo, independente da oitava.

4. **Sincronização com o "Tom Ideal" (Pitch Shifting)**
   O app permite transpor os cantos originais (-2 semitons, +3 semitons, etc). Como a referência do JSON foi extraída do áudio *original*, nós precisamos aplicar a mesma equação de transposição na referência matemática do gráfico. 
   
   Isso é feito em tempo real multiplicando cada amostra de frequência lida por `2^(deslocamento_semitons / 12)`. Assim, a "linha azul/cinza" de referência sobe e desce na tela para refletir perfeitamente a alteração de pitch efetuada.

5. **Feedback Interativo (Tooltips)**
   A biblioteca `pitchy` analisa o fluxo de áudio do microfone via Web Audio API. 
   A frequência detectada (`currentMicHz`) é desenhada como uma linha amarela, e a diferença em semitons entre ela e a referência de áudio no momento exato dita os tooltips exibidos para orientar o canto ("Cante mais GRAVE", "Cante mais AGUDO", etc).

## Como executar a geração dos dados
Caso adicione novos áudios no projeto (`public/audios/`), lembre-se de rodar:
```bash
python3 scripts/generate_pitch_data.py
```
