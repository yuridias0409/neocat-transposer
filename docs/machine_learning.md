# Machine Learning e Feedback Vocal

O módulo de Feedback (`FeedbackEngine.js`) é responsável por duas frentes de aprendizado, visando aprimorar tanto o perfil de usuários individuais quanto a assertividade global da base de dados dos cantos.

## 1. Aprendizado Pessoal (Fine-Tuning do Usuário)

O perfil de voz de uma pessoa nem sempre é estritamente rígido, e calibrações de microfone podem apresentar erros. Quando o usuário toca uma música com a sugestão de tom do sistema, ele pode avaliar se o tom final ficou "Muito Alto", "Ótimo" ou "Muito Baixo".

O algoritmo calcula a **frequência máxima real** que o usuário cantou naquele momento:
$Freq_{Atual} = Freq_{Original} \times 2^{\frac{Tom_{Atual}}{12}}$

### Dinâmica de Ajuste
- Se o usuário reporta **MUITO ALTO**: significa que a voz dele "quebrou" ou forçou demais para alcançar aquela $Freq_{Atual}$. O algoritmo assume que o $f0_{max}$ do usuário no banco de dados está superestimado. O sistema aplica uma redução percentual de **-5%** no $f0_{max}$ daquele usuário.
- Se o usuário reporta **MUITO BAIXO**: significa que a voz ficou grave demais e inaudível. O sistema ajusta o $f0_{min}$ daquele usuário subindo a régua em **+5%**.

Caso o usuário dê feedbacks negativos contínuos por mais de 5 vezes em cantos diferentes, um gatilho de recalibração é ativado sugerindo que ele refaça o processo completo na página "Calibrador".

## 2. Aprendizado Global (Revisão da Música)

Às vezes, a culpa não é do perfil vocal do usuário, mas sim de um dado errado da própria música (ex: a nota mais alta extraída pelo Python foi equivocada devido a um instrumento de sopro agudo).

O sistema agrega todas as avaliações no documento da música no banco de dados (Firebase).

### O Gatilho Global
- Um limiar foi estabelecido em **20 feedbacks negativos** do mesmo tipo ("MUITO ALTO").
- Se 20 usuários reportam que a mesma música está alta demais de forma persistente, o algoritmo entende que o `freq_max_curada` daquela música está mais alto do que a melodia principal cantável.
- Como resposta autônoma, o banco de dados da música sofre uma correção (redução da referência) para todos os futuros usuários. O contador de feedbacks negativos daquela música é zerado.
