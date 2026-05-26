# Contexto do Projeto: Bolão Copa 2026 (Anytools)

Este documento reúne todas as especificações técnicas, arquitetura de software, regras de negócio e informações de segurança do aplicativo **Bolão Copa 2026 - Anytools**.

---

## 1. Visão Geral do Aplicativo
O aplicativo é um **Bolão interno** exclusivo para colaboradores do grupo **Anytools/DB1** para a Copa do Mundo FIFA de 2026 (sediada nos EUA, Canadá e México).

- **Público-alvo**: Colaboradores das unidades de negócio: *Koncili*, *Anymarket*, *Predize*, *Winnerbox* e *Marca Seleta*.
- **Modelo de Execução**: Single Page Application (SPA) contida em um único arquivo `index.html`.
- **Hospedagem**: Local ou qualquer servidor de arquivos estáticos.
- **Backend/Banco de Dados**: Firebase (Authentication e Firestore).

---

## 2. Arquitetura do Sistema
O projeto é extremamente simplificado e centralizado:
- **`index.html`**: Contém toda a marcação HTML5, estilização (CSS embutido) e lógica do cliente (JavaScript ES6 com módulos importados do Firebase).
- **`README.md`**: Descrição básica do repositório.

### Stack Tecnológica
- **Linguagens**: HTML5, CSS3 vanilla (design escuro com paleta customizada), JavaScript vanilla (ES6).
- **Fontes**: *Unbounded* (títulos/marca) e *Inter* (corpo do texto) via Google Fonts.
- **Serviços de Terceiros**:
  - **Firebase Web SDK v10**:
    - **Authentication**: Registro e login de usuários.
    - **Firestore Database**: Armazenamento de dados de usuários, palpites, convites e resultados de jogos.
  - **API-Sports (Football)**: Sincronização e atualização de placares em tempo real.
  - **FlagCDN**: Renderização de bandeiras das seleções nos componentes visuais.

---

## 3. Funcionalidades Detalhadas

### 3.1. Controle de Acesso
- **Autenticação Corporativa (SSO)**: O acesso ao Bolão é restrito a colaboradores autenticados por Single Sign-On (SSO) via contas corporativas Microsoft (Entra ID).
- **Sem Formulários de Cadastro**: Não há fluxo de cadastro manual, esquecimento de senha ou gerenciamento de convites. Qualquer pessoa com uma conta corporativa válida da Microsoft pode realizar login direto e começar a utilizar o aplicativo. No primeiro acesso, os dados do perfil (Nome, E-mail e Avatar) são criados automaticamente a partir do SSO e o usuário é convidado a selecionar sua unidade corporativa na aba de Perfil.

### 3.2. Janela e Regras de Palpites
- **Janela Diária**: Os palpites e suas edições são aceitos **exclusivamente das 05:00h às 12:30h (Horário de Brasília - BRT)**, o que equivale a 08:00h às 15:30h UTC. Fora desse intervalo, o sistema bloqueia qualquer modificação ou inserção.
- **Bloqueio por Jogo**: Independente da janela diária estar aberta, o palpite individual para um jogo específico é bloqueado automaticamente **5 minutos antes do kickoff** (horário de início oficial).
- **Armazenamento**: Os palpites são salvos no Firestore sob o caminho `/users/{uid}/predictions/{matchId}`.

### 3.3. Sistema de Pontuação
- **5 pontos (Acerto Exato)**: O participante acerta o placar exato de ambos os times (ex: palpite 2x1, resultado 2x1).
- **3 pontos (Acerto de Resultado)**: O participante acerta o vencedor ou empate, mas erra o número de gols (ex: palpite 2x0, resultado 1x0; ou palpite 1x1, resultado 2x2).
- **0 pontos (Erro)**: Qualquer outro cenário.
- *Nota*: Rodadas classificadas como "Teste" (ex: `test: true`) são marcadas visualmente com uma borda roxa e **não são somadas** ao ranking geral de pontos.

### 3.4. Rankings
O aplicativo calcula e exibe dois rankings principais:
1. **Classificação Geral**: Lista de todos os usuários ordenada de forma decrescente pelo total de pontos acumulados.
2. **Ranking Anytools (Média por Unidade)**: Para manter a disputa justa entre unidades de tamanhos diferentes, calcula a **média de pontos por participante** daquela unidade específica (`soma dos pontos dos membros / total de membros cadastrados da unidade`).

As unidades são:
- **Koncili**: Verde (`#1a7c3e`)
- **Anymarket**: Laranja (`#f47c20`)
- **Predize**: Cinza (`#c8c8c8`)
- **Winnerbox**: Roxo (`#6b3fa0`)
- **Marca Seleta**: Azul (`#1a3a8a`)
- **Holding**: Ciano (`#06b6d4`)

### 3.5. Integração com API-Sports (Placares em Tempo Real)
- O sistema possui um mecanismo de atualização automática de resultados a partir da API de futebol `API-Sports`.
- Para evitar chamadas excessivas que esgotariam a cota gratuita (100 requisições/dia), o sistema utiliza uma trava no Firestore (`/system/apifetch`).
- A atualização é executada no máximo **uma vez por hora** por um cliente conectado que detecte que a hora atual mudou e ainda não foi sincronizada.
- Os resultados obtidos são salvos na coleção `results` do Firestore, o que dispara re-renderizações automáticas via listeners (`onSnapshot`) em todos os clientes conectados.

### 3.6. Fase Eliminatória (Mata-Mata)
- O mata-mata (Oitavas, Quartas, Semifinais e Final) é gerenciado manualmente pelo administrador via painel de controle.
- Os confrontos e placares são salvos no documento `torneio/matamata` no Firestore e exibidos na aba "Torneio -> Mata-Mata".

---

## 4. Painel Administrativo
Exclusivo para e-mails cadastrados no array `ADMINS` no código fonte da aplicação:
```javascript
const ADMINS = ["luigigonzaga96@gmail.com", "bruno.rossmann@db1.com.br", "jocimar.huss@db1.com.br"];
```

### Funcionalidades do Administrador:
1. **Monitoramento Geral**: Visualização de estatísticas gerais do bolão, quantidade de participantes e unidades ativas.
2. **Resultados Oficiais Manuais**: Permite forçar o resultado de um jogo manualmente ou reiniciar o placar, acionando o recálculo automático de pontuação para todos os usuários.
3. **Gerenciamento do Mata-Mata**: Cadastro dos confrontos da fase eliminatória.
4. **Radar de Segurança**: Uma visão geral do status de conformidade do projeto (se o Firebase Auth está ativo, regras do Firestore e avisos sobre chaves de API expostas no código cliente).

---

## 5. Estrutura do Banco de Dados (Firestore)

### Coleção `users`
Documento identificado pelo `uid` do Firebase Auth:
- `name` (string): Nome do participante.
- `email` (string): E-mail do participante.
- `emoji` (string): Emoji escolhido como avatar.
- `unit` (string): Identificador da unidade (ex: `"koncili"`).
- `pts` (number): Pontuação atual acumulada.

#### Subcoleção `users/{uid}/predictions`
Documento identificado pelo `matchId` (ID do jogo):
- `home` (number): Gols do time mandante.
- `away` (number): Gols do time visitante.

### Coleção `results`
Documento identificado pelo `matchId` (ID do jogo):
- `home` (number/null): Gols reais do time mandante.
- `away` (number/null): Gols reais do time visitante.
- `live` (boolean): Indica se a partida está ocorrendo no momento.
- `updatedAt` (timestamp): Data e hora da última sincronização.

### Coleção `system`
Documento `apifetch`:
- `hora` (string): String da hora da última consulta (formato `YYYY-MM-DDTHH`).
- `who` (string): E-mail do usuário que disparou a chamada da API.
- `at` (timestamp): Data/hora exata do fetch.

### Documento `torneio/matamata`
- `oitavas`, `quartas`, `semis`, `final` (arrays de objetos):
  - `h` (string): Nome do time mandante.
  - `a` (string): Nome do time visitante.
  - `gh` (number/null): Gols do time mandante.
  - `ga` (number/null): Gols do time visitante.

---

## 6. Considerações de Segurança e Boas Práticas

> [!WARNING]
> **Chaves Expostas no Cliente**: Como o aplicativo é inteiramente executado no navegador, chaves como a do Firebase SDK (`apiKey`) e da API-Sports (`APIKEY`) estão visíveis no código-fonte.
> - **Firebase**: É seguro manter a `apiKey` no cliente, desde que as **Regras de Segurança do Firestore** estejam configuradas de forma rígida (bloqueando leituras e escritas não autenticadas).
> - **API-Sports**: Risco de uso não autorizado da cota diária (100 requisições/dia). Recomenda-se mover o repositório do GitHub para **Privado** para reduzir a exposição.

> [!IMPORTANT]
> **Regras de Segurança do Firestore (Recomendadas)**:
> Certifique-se de configurar as regras do Firestore no console do Firebase para exigir autenticação. Por exemplo:
> - Apenas o próprio usuário autenticado pode gravar em `/users/{uid}/predictions/{matchId}` e `/users/{uid}`.
> - Apenas administradores podem gravar na coleção `results` e no documento `torneio/matamata`.

---

## 7. Instruções para Execução Local
Para rodar e testar o bolão em seu ambiente de desenvolvimento:
1. Navegue até a pasta do projeto:
   ```bash
   cd /home/jocimar/Lab/copa2026-bolao
   ```
2. Utilize uma ferramenta leve de servidor web para servir o arquivo `index.html` (para que o OAuth/Firebase funcione adequadamente via protocolo HTTP/HTTPS ao invés de `file://`):
   ```bash
   npx serve
   ```
   *Ou utilizando o Python:*
   ```bash
   python3 -m http.server 8000
   ```
3. Abra o navegador em `http://localhost:3000` (ou `http://localhost:8000`).
