# Algoritmo de Transposição e Cálculo de Capotraste

O Neocat Transposer realiza cálculos matemáticos para adequar o tom original de uma música ao perfil vocal único de cada salmista.

## 1. Conversão de Notas para Frequência (Hertz)

A música ocidental é dividida em 12 semitons por oitava. A frequência de qualquer nota pode ser calculada a partir de uma nota de referência, geralmente o **Lá 4 (A4) = 440 Hz**.

A fórmula utilizada para encontrar a frequência de um semitom $n$ passos distante do A4 é:
\[ f = 440 \times 2^{\frac{n}{12}} \]

Para o nosso sistema, consideramos que subir **1 semitom** no tom da música multiplica todas as frequências originais da música por $2^{\frac{1}{12}} \approx 1.05946$.

## 2. Esforço Vocal (Mean Squared Error)

Quando um usuário clica em "Meu Tom Ideal", o sistema calcula um **Custo de Esforço** para cada transposição possível (de -6 a +6 semitons). O objetivo é encontrar a transposição que exija o menor esforço da voz do cantor.

1. Identifica-se a **frequência mínima** ($f_{min}$) e **frequência máxima** ($f_{max}$) do canto original.
2. Identifica-se a **frequência mínima** ($U_{min}$) e **frequência máxima** ($U_{max}$) suportada pelo perfil vocal do usuário.
3. Para cada transposição $t$:
   - Calculam-se as novas frequências do canto: 
     $f'_{min} = f_{min} \times 2^{\frac{t}{12}}$
     $f'_{max} = f_{max} \times 2^{\frac{t}{12}}$
   - O esforço é calculado penalizando severamente se as novas notas ultrapassarem os limites do cantor:
     $Esforço_{max} = \max(0, f'_{max} - U_{max})^2$
     $Esforço_{min} = \max(0, U_{min} - f'_{min})^2$
   - Se o canto couber perfeitamente dentro da tessitura, busca-se centralizá-lo para maior conforto, minimizando a distância entre o centro do canto e o centro da voz do cantor.

## 3. Cálculo Dinâmico do Capotraste

Além de transpor as frequências, o sistema avalia os **acordes gerados** por essa transposição. 

1. Transpor o tom em $+t$ semitons afeta diretamente o shape (desenho) dos acordes.
2. Acordes com pestanas (como Fá, Si bemol) são mais difíceis de tocar.
3. O algoritmo simula o uso de um capotraste nas casas de 1 a 5.
4. Para cada posição do capotraste $C$, ele "puxa" o formato dos acordes de volta em $C$ semitons. 
5. Ele então conta quantos acordes abertos (D, G, C, A, E) existem na nova formatação. A formatação que tiver a menor quantidade de pestanas e for mais fácil de tocar é recomendada para o usuário.
